import 'package:flutter/material.dart';
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
  final String url = "https://prima-eta.vercel.app/";

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF4C9AA6),
      body: SafeArea(
        child: InAppWebView(
          initialUrlRequest: URLRequest(url: WebUri(url)),
          onWebViewCreated: (controller) {
            webViewController = controller;
          },
          onLoadStop: (controller, url) async {},
          onReceivedError: (controller, request, error) {},
          initialSettings: InAppWebViewSettings(
            transparentBackground: true,
            javaScriptEnabled: true,
          ),
        ),
      ),
    );
  }
}
