import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;

/// Config Firebase untuk prima_apps (Android).
/// Nilai diambil dari android/app/google-services.json.
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform => android;

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyBsl7VYjGF3oZvtP1whGxuL4gqIH8r5mMM',
    appId: '1:913525589105:android:4301e501ee742d82d647d0',
    messagingSenderId: '913525589105',
    projectId: 'prima-888a9',
    storageBucket: 'prima-888a9.firebasestorage.app',
  );
}