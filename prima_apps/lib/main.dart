import 'dart:async';

import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'firebase_options.dart';
import 'services/notification_service.dart';

/// Penampung navigasi yang datang sebelum WebView siap
/// (mis. app dibuka dari notifikasi saat terminated).
class PendingNavigation {
  static String? urlPath;
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Inisialisasi Firebase & notifikasi.
  // App tetap terbuka walau init gagal (mis. device tanpa Play Services).
  try {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    unawaited(NotificationService.instance.init());
  } catch (_) {}

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Prima Linc',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF4C9AA6)),
        useMaterial3: true,
      ),
      home: const PrimaWebView(),
    );
  }
}

class PrimaWebView extends StatefulWidget {
  const PrimaWebView({super.key});

  @override
  State<PrimaWebView> createState() => _PrimaWebViewState();
}

class _PrimaWebViewState extends State<PrimaWebView> {
  InAppWebViewController? webViewController;
  PullToRefreshController? pullToRefreshController;
  final String url = "https://prima-eta.vercel.app/";

  @override
  void initState() {
    super.initState();

    // Navigasi ke halaman yang tepat saat notifikasi di-tap
    NotificationService.instance.onNotificationTapped = (data) {
      String? path;
      if (data['type'] == 'SOCIAL' && data['post_id'] != null) {
        path = "/komunitas/${data['post_id']}";
      } else if (data['pond_id'] != null) {
        path = "/kolam/${data['pond_id']}";
      }
      
      if (path != null) {
        _openPath(path);
      }
    };

    pullToRefreshController = PullToRefreshController(
      settings: PullToRefreshSettings(
        color: const Color(0xFF4C9AA6),
      ),
      onRefresh: () async {
        if (webViewController != null) {
          webViewController?.reload();
        }
      },
    );
  }

  /// Buka path tertentu di WebView.
  /// Jika controller belum siap, simpan dulu dan buka saat onLoadStop.
  void _openPath(String path) {
    final c = webViewController;
    if (c != null) {
      c.loadUrl(
        urlRequest: URLRequest(url: WebUri("https://prima-eta.vercel.app$path")),
      );
    } else {
      PendingNavigation.urlPath = path;
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        if (webViewController != null) {
          if (await webViewController!.canGoBack()) {
            webViewController!.goBack();
          } else {
            SystemNavigator.pop();
          }
        } else {
          SystemNavigator.pop();
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF4C9AA6),
        body: SafeArea(
          child: InAppWebView(
            initialUrlRequest: URLRequest(url: WebUri(url)),
            pullToRefreshController: pullToRefreshController,
            onWebViewCreated: (controller) {
              webViewController = controller;

              // Bridge JS: halaman web mengirim {userId, accessToken}
              // setelah login, lalu Flutter mendaftarkan FCM token-nya.
              controller.addJavaScriptHandler(
                handlerName: 'registerFcm',
                callback: (args) {
                  NotificationService.instance.registerFromBridge(args);
                  return null;
                },
              );
            },
            onLoadStop: (controller, url) async {
              pullToRefreshController?.endRefreshing();

              // Ada pending navigasi dari notifikasi? Buka sekarang.
              final pending = PendingNavigation.urlPath;
              if (pending != null) {
                PendingNavigation.urlPath = null;
                await controller.loadUrl(
                  urlRequest: URLRequest(url: WebUri("https://prima-eta.vercel.app$pending")),
                );
              }
            },
            onReceivedError: (controller, request, error) {
              pullToRefreshController?.endRefreshing();
            },
            onScrollChanged: (controller, x, y) {
              if (y <= 0) {
                pullToRefreshController?.setEnabled(true);
              } else {
                pullToRefreshController?.setEnabled(false);
              }
            },
            initialSettings: InAppWebViewSettings(
              transparentBackground: true,
              javaScriptEnabled: true,
            ),
          ),
        ),
      ),
    );
  }
}