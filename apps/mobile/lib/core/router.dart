import 'package:go_router/go_router.dart';
import '../features/home/home_screen.dart';
import '../features/vendors/vendors_screen.dart';
import '../features/vendors/vendor_detail_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/bookings/bookings_screen.dart';
import '../features/profile/profile_screen.dart';
import '../shared/widgets/app_shell.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    ShellRoute(
      builder: (context, state, child) => AppShell(child: child),
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => const HomeScreen(),
        ),
        GoRoute(
          path: '/vendors',
          builder: (context, state) {
            final category = state.uri.queryParameters['category'];
            return VendorsScreen(initialCategory: category);
          },
        ),
        GoRoute(
          path: '/bookings',
          builder: (context, state) => const BookingsScreen(),
        ),
        GoRoute(
          path: '/profile',
          builder: (context, state) => const ProfileScreen(),
        ),
      ],
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/vendors/:id',
      builder: (context, state) => VendorDetailScreen(
        vendorId: state.pathParameters['id']!,
      ),
    ),
  ],
);
