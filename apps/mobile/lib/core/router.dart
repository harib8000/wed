import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/home/home_screen.dart';
import '../features/vendors/vendors_screen.dart';
import '../features/vendors/vendor_detail_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/bookings/bookings_screen.dart';
import '../features/bookings/booking_detail_screen.dart';
import '../features/bookings/checkout_screen.dart';
import '../features/chat/chat_screen.dart';
import '../features/wishlist/wishlist_screen.dart';
import '../features/notifications/notifications_screen.dart';
import '../features/reviews/write_review_screen.dart';
import '../features/checklist/checklist_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/vendor_dashboard/vendor_dashboard_screen_v2.dart';
import '../features/vendor_dashboard/vendor_analytics_screen.dart';
import '../features/vendor_dashboard/vendor_bookings_screen_v2.dart';
import '../features/vendor_dashboard/vendor_earnings_screen_v2.dart';
import '../features/vendor_dashboard/vendor_profile_screen_v2.dart';
import '../features/vendor_dashboard/vendor_leads_screen.dart';
import '../features/vendor_dashboard/vendor_calendar_screen.dart';
import '../features/vendor_dashboard/vendor_reviews_screen.dart';
import '../features/vendor_dashboard/vendor_settings_screen.dart';
import '../models/user.dart';
import '../providers/auth_provider.dart';
import '../shared/widgets/app_shell.dart';
import '../shared/widgets/vendor_app_shell.dart';

// Public routes that don't require authentication
const _publicRoutes = {'/login'};

// Auth guard — redirects to /login if unauthenticated, and routes by role
String? _authRedirect(WidgetRef ref, GoRouterState state) {
  final authState = ref.read(authProvider);
  final authStatus = authState.status;
  final location = state.matchedLocation;

  if (_publicRoutes.contains(location)) {
    if (authStatus == AuthStatus.authenticated) {
      // Redirect based on role
      final role = authState.user?.role ?? 'CUSTOMER';
      return role == 'VENDOR' ? '/vendor/dashboard' : '/';
    }
    return null;
  }
  if (authStatus != AuthStatus.authenticated) return '/login';

  // Role-based access control
  final role = authState.user?.role ?? 'CUSTOMER';
  final isVendorRoute = location.startsWith('/vendor');

  if (role == 'VENDOR' && !isVendorRoute && location != '/notifications') {
    return '/vendor/dashboard';
  }
  if (role == 'CUSTOMER' && isVendorRoute) {
    return '/';
  }

  return null;
}

GoRouter buildRouter(WidgetRef ref) => GoRouter(
  initialLocation: '/',
  redirect: (context, state) => _authRedirect(ref, state),
  routes: [
    // ─── Customer App (ShellRoute with customer bottom nav) ───
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
          path: '/wishlist',
          builder: (context, state) => const WishlistScreen(),
        ),
        GoRoute(
          path: '/checklist',
          builder: (context, state) => const ChecklistScreen(),
        ),
        GoRoute(
          path: '/profile',
          builder: (context, state) => const ProfileScreen(),
        ),
      ],
    ),

    // Auth
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),

    // Vendor detail (full screen, no bottom nav)
    GoRoute(
      path: '/vendors/:id',
      builder: (context, state) => VendorDetailScreen(
        vendorId: state.pathParameters['id']!,
      ),
    ),

    // Booking detail
    GoRoute(
      path: '/bookings/:id',
      builder: (context, state) => BookingDetailScreen(
        bookingId: state.pathParameters['id']!,
      ),
    ),

    // Checkout / booking creation
    GoRoute(
      path: '/checkout/:vendorId',
      builder: (context, state) {
        final amountStr = state.uri.queryParameters['amount'];
        final bookingId = state.uri.queryParameters['bookingId'];
        return CheckoutScreen(
          vendorId: state.pathParameters['vendorId']!,
          existingBookingId: bookingId,
          prefilledAmount: amountStr != null ? int.tryParse(amountStr) : null,
        );
      },
    ),

    // Chat with vendor
    GoRoute(
      path: '/chat/:vendorId',
      builder: (context, state) => ChatScreen(
        vendorId: state.pathParameters['vendorId']!,
      ),
    ),

    // Notifications
    GoRoute(
      path: '/notifications',
      builder: (context, state) => const NotificationsScreen(),
    ),

    // Write review
    GoRoute(
      path: '/reviews/write',
      builder: (context, state) => WriteReviewScreen(
        vendorId: state.uri.queryParameters['vendorId'] ?? '',
        bookingId: state.uri.queryParameters['bookingId'],
      ),
    ),

    // ─── Vendor/Seller App (ShellRoute with vendor bottom nav) ───
    ShellRoute(
      builder: (context, state, child) => VendorAppShell(child: child),
      routes: [
        GoRoute(
          path: '/vendor/dashboard',
          builder: (context, state) => const VendorDashboardScreen(),
        ),
        GoRoute(
          path: '/vendor/analytics',
          builder: (context, state) => const VendorAnalyticsScreen(),
        ),
        GoRoute(
          path: '/vendor/bookings',
          builder: (context, state) => const VendorBookingsScreen(),
        ),
        GoRoute(
          path: '/vendor/earnings',
          builder: (context, state) => const VendorEarningsScreen(),
        ),
        GoRoute(
          path: '/vendor/profile',
          builder: (context, state) => const VendorProfileScreen(),
        ),
      ],
    ),

    // Vendor sub-screens (full-screen, no bottom nav)
    GoRoute(
      path: '/vendor/leads',
      builder: (context, state) => const VendorLeadsScreen(),
    ),
    GoRoute(
      path: '/vendor/calendar',
      builder: (context, state) => const VendorCalendarScreen(),
    ),
    GoRoute(
      path: '/vendor/reviews',
      builder: (context, state) => const VendorReviewsScreen(),
    ),
    GoRoute(
      path: '/vendor/settings',
      builder: (context, state) => const VendorSettingsScreen(),
    ),
  ],
);
