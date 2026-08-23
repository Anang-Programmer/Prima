import 'dart:convert';
import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Background message handler (harus top-level function)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  // TIDAK menampilkan notifikasi lokal di sini - pesan bermuatan
  // 'notification' sudah ditampilkan otomatis oleh sistem saat app
  // background/tertutup. Menampilkan lagi di sini = notif dobel.
}

class NotificationService {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _local = FlutterLocalNotificationsPlugin();

  // Old declaration removed
  /// Notification channel untuk Prima
  static const _androidChannel = AndroidNotificationChannel(
    'prima_timers',
    'Timer Pakan & Probiotik',
    description: 'Notifikasi pengingat pakan, cek anco, dan probiotik',
    importance: Importance.high,
    playSound: true,
  );

  /// Inisialisasi semua komponen notifikasi
  Future<void> init() async {
    // --- 1. Request permission ---
    final settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
    if (settings.authorizationStatus == AuthorizationStatus.denied) return;

    // --- 2. Setup local notifications ---
    const androidInit = AndroidInitializationSettings('@mipmap/launcher_icon');
    await _local.initialize(
      const InitializationSettings(android: androidInit),
      onDidReceiveNotificationResponse: _onTapNotification,
    );

    // Buat notification channel
    await _local
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_androidChannel);

    // --- 3. Foreground messages ---
    FirebaseMessaging.onMessage.listen(_showFromRemote);

    // --- 4. Handle notification tap saat app dibuka dari terminated state ---
    final initialMsg = await _fcm.getInitialMessage();
    if (initialMsg != null) {
      _handleMessageTap(initialMsg.data);
    }

    // --- 5. Handle notification tap saat app di background ---
    FirebaseMessaging.onMessageOpenedApp.listen((msg) {
      _handleMessageTap(msg.data);
    });
  }

  /// Cek apakah notifikasi diaktifkan user
  Future<bool> isEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('notifications_enabled') ?? true; // default ON
  }

  /// Toggle notifikasi on/off
  Future<void> setEnabled(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notifications_enabled', enabled);
  }

  /// Tampilkan notifikasi lokal dari FCM remote message
  Future<void> _showFromRemote(RemoteMessage message) async {
    final enabled = await isEnabled();
    if (!enabled) return;

    final notification = message.notification;
    final data = message.data;

    final title = notification?.title ?? data['title'] ?? 'Prima';
    final body = notification?.body ?? data['body'] ?? '';

    await _local.show(
      message.hashCode,
      title,
      body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _androidChannel.id,
          _androidChannel.name,
          channelDescription: _androidChannel.description,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/launcher_icon',
        ),
      ),
      payload: jsonEncode(data),
    );
  }

  /// Handler saat user tap notifikasi lokal
  void _onTapNotification(NotificationResponse response) {
    if (response.payload == null) return;
    try {
      final data = jsonDecode(response.payload!) as Map<String, dynamic>;
      _handleMessageTap(data);
    } catch (_) {}
  }

  /// Callback yang dipanggil saat user tap notifikasi — menerima data payload
  void Function(Map<String, dynamic> data)? onNotificationTapped;

  /// Navigate ke halaman yang tepat
  void _handleMessageTap(Map<String, dynamic> data) {
    if (onNotificationTapped != null) {
      onNotificationTapped!(data);
    }
  }

  /// Supabase config untuk pendaftaran token
  static const _supabaseUrl = 'https://pexrvyolxkjyhzdxgrst.supabase.co';
  static const _supabaseAnonKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBleHJ2eW9seGtqeWh6ZHhncnN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0MzY5NDcsImV4cCI6MjEwMjAxMjk0N30.wvAMhnOfXp3IoYTfzmF3304fG9dg04ne1SEsuqR2QDU';

  /// Ambil FCM token device ini
  Future<String?> getToken() => _fcm.getToken();

  /// Dipanggil dari WebView bridge (JS handler "registerFcm").
  /// args: List berisi JSON string {userId, accessToken}
  Future<void> registerFromBridge(dynamic args) async {
    try {
      String raw = "";
      if (args is List && args.isNotEmpty) raw = args.first.toString();
      else if (args is String) raw = args;
      if (raw.isEmpty) return;
      final payload = jsonDecode(raw) as Map<String, dynamic>;
      final userId = payload['userId']?.toString();
      final accessToken = payload['accessToken']?.toString();
      if (userId == null || accessToken == null || userId.isEmpty || accessToken.isEmpty) return;

      final token = await getToken();
      if (token == null) return;

      // Upsert ke fcm_tokens via REST (RLS: auth.uid() = user_id)
      final client = HttpClient();
      final req = await client.postUrl(Uri.parse('$_supabaseUrl/rest/v1/fcm_tokens?on_conflict=token'));
      req.headers.set(HttpHeaders.authorizationHeader, "Bearer $accessToken");
      req.headers.set('apikey', _supabaseAnonKey);
      req.headers.set(HttpHeaders.contentTypeHeader, "application/json");
      req.headers.set('Prefer', 'resolution=merge-duplicates');
      req.add(utf8.encode(jsonEncode([
        {"user_id": userId, "token": token, "platform": "android"},
      ])));
      final res = await req.close();
      await res.drain<void>();
      client.close();
    } catch (_) {}
  }
}
