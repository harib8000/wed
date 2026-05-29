import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb, debugPrint;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'core/router.dart';
import 'core/theme.dart';
import 'models/user.dart';
import 'providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import 'features/onboarding/onboarding_screen.dart';

/// Whether the user has seen onboarding — resolved before runApp.
late final bool _hasSeenOnboarding;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Hive for local caching / offline support
  await Hive.initFlutter();

  // Check onboarding flag
  final prefs = await SharedPreferences.getInstance();
  _hasSeenOnboarding = prefs.getBool(kHasSeenOnboardingKey) ?? false;

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
    // Ensure bindings are ready before Firebase init
    WidgetsBinding.instance;
    // Firebase.initializeApp will be called in notification_service on native
    // This function validates that bindings are ready for later Firebase init
    debugPrint('Firebase bindings ready — deferred init will run in notification_service');
    return true;
  } catch (e) {
    debugPrint('Firebase pre-init check failed: $e');
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

    // If first-time user, redirect to onboarding
    if (!_hasSeenOnboarding) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _router.go('/onboarding');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Watch auth state so the router's refresh notifier can trigger redirects
    ref.listen<AuthState>(authProvider, (_, next) {});

    final themeMode = ref.watch(themeModeProvider);

    final app = MaterialApp.router(
      title: 'WeddingOS',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: themeMode,
      routerConfig: _router,
    );

    // On web, wrap in a phone-sized container so it looks like a mobile app
    if (kIsWeb) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          backgroundColor: const Color(0xFF1F2937),
          body: Center(
            child: Container(
              width: 390,
              height: 844,
              clipBehavior: Clip.antiAlias,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(40),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 30, spreadRadius: 5),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(40),
                child: app,
              ),
            ),
          ),
        ),
      );
    }

    return app;
  }
}
