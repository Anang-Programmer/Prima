import 'package:flutter/material.dart';
// import 'package:firebase_core/firebase_core.dart';
// import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
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
            },
            onLoadStop: (controller, url) async {
              pullToRefreshController?.endRefreshing();
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
