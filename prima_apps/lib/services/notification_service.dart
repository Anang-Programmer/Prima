import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Background message handler (harus top-level function)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  await NotificationService.instance._showFromRemote(message);
}

class NotificationService {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _local = FlutterLocalNotificationsPlugin();

  /// Callback yang dipanggil saat user tap notifikasi — menerima pond_id
  void Function(String pondId)? onNotificationTapped;

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
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
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
          icon: '@mipmap/ic_launcher',
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

  /// Navigate ke halaman kolam yang tepat
  void _handleMessageTap(Map<String, dynamic> data) {
    final pondId = data['pond_id'] as String?;
    if (pondId != null && onNotificationTapped != null) {
      onNotificationTapped!(pondId);
    }
  }
}
