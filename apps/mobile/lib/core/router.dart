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
import '../models/user.dart';
import '../providers/auth_provider.dart';
import '../shared/widgets/app_shell.dart';

// Public routes that don't require authentication
const _publicRoutes = {'/login'};

// Auth guard — redirects to /login if unauthenticated
String? _authRedirect(WidgetRef ref, GoRouterState state) {
  final authStatus = ref.read(authProvider).status;
  final location = state.matchedLocation;

  if (_publicRoutes.contains(location)) {
    // already authenticated → go home
    if (authStatus == AuthStatus.authenticated) return '/';
    return null;
  }
  // While loading or unauthenticated → show login
  if (authStatus != AuthStatus.authenticated) return '/login';
  return null;
}

GoRouter buildRouter(WidgetRef ref) => GoRouter(
  initialLocation: '/',
  redirect: (context, state) => _authRedirect(ref, state),
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
  ],
);
