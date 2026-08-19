import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // --- Firebase ---
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

  // --- Supabase (untuk menyimpan FCM token) ---
  await Supabase.initialize(
    url: 'https://pexrvyolxkjyhzdxgrst.supabase.co',
    anonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBleHJ2eW9seGtqeWh6ZHhncnN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0MzY5NDcsImV4cCI6MjEwMjAxMjk0N30.wvAMhnOfXp3IoYTfzmF3304fG9dg04ne1SEsuqR2QDU',
  );

  // --- Notification Service ---
  await NotificationService.instance.init();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Prima',
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

    // Setup notification tap handler → navigate WebView ke halaman kolam
    NotificationService.instance.onNotificationTapped = (pondId) {
      webViewController?.loadUrl(
        urlRequest: URLRequest(
          url: WebUri("https://prima-eta.vercel.app/kolam/$pondId"),
        ),
      );
    };

    // Listen auth state: begitu user login di WebView, simpan FCM token
    Supabase.instance.client.auth.onAuthStateChange.listen((data) {
      if (data.event == AuthChangeEvent.signedIn) {
        NotificationService.instance.saveTokenToSupabase();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF4C9AA6),
      body: SafeArea(
        child: InAppWebView(
          initialUrlRequest: URLRequest(url: WebUri(url)),
          pullToRefreshController: pullToRefreshController,
          onWebViewCreated: (controller) {
            webViewController = controller;

            // JavaScript handler: web bisa toggle notifikasi on/off
            controller.addJavaScriptHandler(
              handlerName: 'toggleNotification',
              callback: (args) async {
                if (args.isNotEmpty) {
                  final enabled = args[0] as bool;
                  await NotificationService.instance.setEnabled(enabled);
                  return {'success': true, 'enabled': enabled};
                }
                return {'success': false};
              },
            );

            // JavaScript handler: web bisa cek status notifikasi
            controller.addJavaScriptHandler(
              handlerName: 'getNotificationStatus',
              callback: (args) async {
                final enabled = await NotificationService.instance.isEnabled();
                return {'enabled': enabled};
              },
            );
          },
          onLoadStop: (controller, url) async {
            pullToRefreshController?.endRefreshing();

            // Coba simpan FCM token setiap kali halaman selesai dimuat
            // (untuk kasus user sudah login sebelumnya)
            NotificationService.instance.saveTokenToSupabase();
          },
          onReceivedError: (controller, request, error) {
            pullToRefreshController?.endRefreshing();
          },
          // Trik mengatasi bug SwipeRefreshLayout vs Bottom Nav:
          // Matikan pull-to-refresh saat tidak di paling atas halaman
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
    );
  }
}
