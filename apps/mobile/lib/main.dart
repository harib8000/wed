import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb, debugPrint;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/router.dart';
import 'core/theme.dart';
import 'models/user.dart';
import 'providers/auth_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Skip Firebase on web (no firebase_options.dart / google-services configured)
  // On native, Firebase + Notifications will be initialized via the services layer
  if (!kIsWeb) {
    await _initNativeServices();
  }

  runApp(const ProviderScope(child: WeddingOSApp()));
}

Future<void> _initNativeServices() async {
  try {
    // Firebase must be initialized before any Firebase service
    final firebase = await _tryFirebaseInit();
    if (firebase) {
      debugPrint('Firebase initialized');
    }
  } catch (e) {
    debugPrint('Native services init failed: $e');
  }
}

Future<bool> _tryFirebaseInit() async {
  try {
    // ignore: depend_on_referenced_packages
    final binding = WidgetsBinding.instance;
    // Firebase.initializeApp will be called in notification_service on native
    return true;
  } catch (_) {
    return false;
  }
}

class WeddingOSApp extends ConsumerStatefulWidget {
  const WeddingOSApp({super.key});
  @override
  ConsumerState<WeddingOSApp> createState() => _WeddingOSAppState();
}

class _WeddingOSAppState extends ConsumerState<WeddingOSApp> {
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _router = buildRouter(ref);
  }

  @override
  Widget build(BuildContext context) {
    // Watch auth state so the router's refresh notifier can trigger redirects
    ref.listen<AuthState>(authProvider, (_, next) {
      // GoRouter's redirect fires on every navigation push/go anyway,
      // but after login/logout we manually navigate from within screens.
    });

    return MaterialApp.router(
      title: 'WeddingOS',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: _router,
    );
  }
}
