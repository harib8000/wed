import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/admin_dashboard/admin_bookings_screen.dart';
import '../features/admin_dashboard/admin_dashboard_screen.dart';
import '../features/admin_dashboard/admin_disputes_screen.dart';
import '../features/admin_dashboard/admin_reports_screen.dart';
import '../features/admin_dashboard/admin_settings_screen.dart';
import '../features/admin_dashboard/admin_users_screen.dart';
import '../features/admin_dashboard/admin_vendors_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/bookings/booking_detail_screen.dart';
import '../features/bookings/bookings_screen.dart';
import '../features/bookings/checkout_screen.dart';
import '../features/chat/chat_screen.dart';
import '../features/checklist/checklist_screen.dart';
import '../features/coordinator_dashboard/coordinator_dashboard_screen.dart';
import '../features/coordinator_dashboard/coordinator_event_detail_screen.dart';
import '../features/coordinator_dashboard/coordinator_events_screen.dart';
import '../features/coordinator_dashboard/coordinator_profile_screen.dart';
import '../features/coordinator_dashboard/coordinator_tasks_screen.dart';
import '../features/coordinator_dashboard/coordinator_timeline_screen.dart';
import '../features/coordinator_dashboard/coordinator_vendors_screen.dart';
import '../features/home/home_screen.dart';
import '../features/notifications/notifications_screen.dart';
import '../features/onboarding/onboarding_screen.dart';
import '../features/budget/budget_planner_screen.dart';
import '../features/guests/guest_management_screen.dart';
import '../features/ai/ai_suggestions_screen.dart';
import '../features/search/search_screen.dart';
import '../features/payment/payment_result_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/vendor_dashboard/vendor_onboarding_screen.dart';
import '../features/vendor_dashboard/vendor_subscription_screen.dart';
import '../features/coordinator_dashboard/coordinator_onboarding_screen.dart';
import '../features/reviews/write_review_screen.dart';
import '../features/vendor_dashboard/vendor_analytics_screen.dart';
import '../features/vendor_dashboard/vendor_bookings_screen_v2.dart';
import '../features/vendor_dashboard/vendor_calendar_screen.dart';
import '../features/vendor_dashboard/vendor_dashboard_screen_v2.dart';
import '../features/vendor_dashboard/vendor_earnings_screen_v2.dart';
import '../features/vendor_dashboard/vendor_kyc_screen.dart';
import '../features/vendor_dashboard/vendor_leads_screen.dart';
import '../features/vendor_dashboard/vendor_profile_screen_v2.dart';
import '../features/vendor_dashboard/vendor_reviews_screen.dart';
import '../features/vendor_dashboard/vendor_settings_screen.dart';
import '../features/vendors/vendor_detail_screen.dart';
import '../features/vendors/vendors_screen.dart';
import '../features/wishlist/wishlist_screen.dart';
import '../providers/auth_provider.dart';
import '../shared/widgets/admin_app_shell.dart';
import '../shared/widgets/app_shell.dart';
import '../shared/widgets/coordinator_app_shell.dart';
import '../shared/widgets/vendor_app_shell.dart';

const _publicRoutes = {'/login', '/onboarding'};

String? _authRedirect(WidgetRef ref, GoRouterState state) {
  final authState = ref.read(authProvider);
  final authStatus = authState.status;
  final location = state.matchedLocation;

  if (_publicRoutes.contains(location)) {
    if (authStatus == AuthStatus.authenticated) {
      return _homeForRole(authState.user?.role ?? 'CUSTOMER');
    }
    return null;
  }

  if (authStatus != AuthStatus.authenticated) {
    return '/login';
  }

  final role = authState.user?.role ?? 'CUSTOMER';
  final isVendorRoute = location.startsWith('/vendor');
  final isCoordinatorRoute = location.startsWith('/coordinator');
  final isAdminRoute = location.startsWith('/admin');
  final allowedSharedRoutes = {
    '/notifications',
    '/payment/result',
  };

  if (allowedSharedRoutes.contains(location)) {
    return null;
  }

  switch (role) {
    case 'VENDOR':
      return isVendorRoute ? null : '/vendor/dashboard';
    case 'COORDINATOR':
      return isCoordinatorRoute ? null : '/coordinator/dashboard';
    case 'ADMIN':
      return isAdminRoute ? null : '/admin/dashboard';
    default:
      return (isVendorRoute || isCoordinatorRoute || isAdminRoute) ? '/' : null;
  }
}

String _homeForRole(String role) {
  switch (role) {
    case 'VENDOR':
      return '/vendor/dashboard';
    case 'COORDINATOR':
      return '/coordinator/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    default:
      return '/';
  }
}

CustomTransitionPage<void> _buildPage(
  BuildContext context,
  GoRouterState state,
  Widget child,
) {
  return CustomTransitionPage<void>(
    key: state.pageKey,
    child: child,
    transitionDuration: const Duration(milliseconds: 280),
    reverseTransitionDuration: const Duration(milliseconds: 220),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final slide = Tween<Offset>(
        begin: const Offset(0.04, 0),
        end: Offset.zero,
      ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic));
      final fade = CurvedAnimation(parent: animation, curve: Curves.easeOut);
      return FadeTransition(
        opacity: fade,
        child: SlideTransition(position: slide, child: child),
      );
    },
  );
}

GoRouter buildRouter(WidgetRef ref) => GoRouter(
      initialLocation: '/',
      routerNeglect: false,
      redirect: (context, state) => _authRedirect(ref, state),
      onException: (context, state, router) => router.go('/'),
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
            GoRoute(
              path: '/budget',
              builder: (context, state) => const BudgetPlannerScreen(),
            ),
            GoRoute(
              path: '/guests',
              builder: (context, state) => const GuestManagementScreen(),
            ),
            GoRoute(
              path: '/ai-suggestions',
              builder: (context, state) => const AiSuggestionsScreen(),
            ),
          ],
        ),
        GoRoute(
          path: '/login',
          pageBuilder: (context, state) =>
              _buildPage(context, state, const LoginScreen()),
        ),
        GoRoute(
          path: '/onboarding',
          pageBuilder: (context, state) =>
              _buildPage(context, state, const OnboardingScreen()),
        ),
        GoRoute(
          path: '/vendors/:id',
          pageBuilder: (context, state) => _buildPage(
            context,
            state,
            VendorDetailScreen(vendorId: state.pathParameters['id']!),
          ),
        ),
        GoRoute(
          path: '/bookings/:id',
          pageBuilder: (context, state) => _buildPage(
            context,
            state,
            BookingDetailScreen(bookingId: state.pathParameters['id']!),
          ),
        ),
        GoRoute(
          path: '/checkout/:vendorId',
          pageBuilder: (context, state) {
            final amountStr = state.uri.queryParameters['amount'];
            final bookingId = state.uri.queryParameters['bookingId'];
            return _buildPage(
              context,
              state,
              CheckoutScreen(
                vendorId: state.pathParameters['vendorId']!,
                existingBookingId: bookingId,
                prefilledAmount:
                    amountStr != null ? int.tryParse(amountStr) : null,
              ),
            );
          },
        ),
        GoRoute(
          path: '/chat/:vendorId',
          pageBuilder: (context, state) => _buildPage(
            context,
            state,
            ChatScreen(vendorId: state.pathParameters['vendorId']!),
          ),
        ),
        GoRoute(
          path: '/notifications',
          pageBuilder: (context, state) =>
              _buildPage(context, state, const NotificationsScreen()),
        ),
        GoRoute(
          path: '/reviews/write',
          pageBuilder: (context, state) => _buildPage(
            context,
            state,
            WriteReviewScreen(
              vendorId: state.uri.queryParameters['vendorId'] ?? '',
              bookingId: state.uri.queryParameters['bookingId'],
            ),
          ),
        ),
        GoRoute(
          path: '/payment/result',
          pageBuilder: (context, state) {
            final statusStr = state.uri.queryParameters['status'] ?? 'pending';
            final status = switch (statusStr) {
              'success' => PaymentResultStatus.success,
              'failure' => PaymentResultStatus.failure,
              _ => PaymentResultStatus.pending,
            };
            return _buildPage(
              context,
              state,
              PaymentResultScreen(
                status: status,
                bookingId: state.uri.queryParameters['bookingId'],
                amount: state.uri.queryParameters['amount'],
                errorMessage: state.uri.queryParameters['error'],
              ),
            );
          },
        ),
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
        GoRoute(
          path: '/vendor/leads',
          pageBuilder: (context, state) =>
              _buildPage(context, state, const VendorLeadsScreen()),
        ),
        GoRoute(
          path: '/vendor/calendar',
          pageBuilder: (context, state) =>
              _buildPage(context, state, const VendorCalendarScreen()),
        ),
        GoRoute(
          path: '/vendor/reviews',
          pageBuilder: (context, state) =>
              _buildPage(context, state, const VendorReviewsScreen()),
        ),
        GoRoute(
          path: '/vendor/settings',
          pageBuilder: (context, state) =>
              _buildPage(context, state, const VendorSettingsScreen()),
        ),
        GoRoute(
          path: '/vendor/kyc',
          pageBuilder: (context, state) =>
              _buildPage(context, state, const VendorKycScreen()),
        ),
        GoRoute(
          path: '/vendor/onboarding',
          pageBuilder: (context, state) =>
              _buildPage(context, state, const VendorOnboardingScreen()),
        ),
        GoRoute(
          path: '/vendor/subscription',
          pageBuilder: (context, state) =>
              _buildPage(context, state, const VendorSubscriptionScreen()),
        ),
        GoRoute(
          path: '/search',
          pageBuilder: (context, state) {
            final q = state.uri.queryParameters['q'] ?? '';
            return _buildPage(context, state, SearchScreen(initialQuery: q));
          },
        ),
        ShellRoute(
          builder: (context, state, child) => CoordinatorAppShell(child: child),
          routes: [
            GoRoute(
              path: '/coordinator/dashboard',
              builder: (context, state) => const CoordinatorDashboardScreen(),
            ),
            GoRoute(
              path: '/coordinator/events',
              builder: (context, state) => const CoordinatorEventsScreen(),
            ),
            GoRoute(
              path: '/coordinator/tasks',
              builder: (context, state) => const CoordinatorTasksScreen(),
            ),
            GoRoute(
              path: '/coordinator/vendors',
              builder: (context, state) => const CoordinatorVendorsScreen(),
            ),
            GoRoute(
              path: '/coordinator/profile',
              builder: (context, state) => const CoordinatorProfileScreen(),
            ),
          ],
        ),
        GoRoute(
          path: '/coordinator/events/:id',
          pageBuilder: (context, state) => _buildPage(
            context,
            state,
            CoordinatorEventDetailScreen(eventId: state.pathParameters['id']!),
          ),
        ),
        GoRoute(
          path: '/coordinator/events/:id/timeline',
          pageBuilder: (context, state) => _buildPage(
            context,
            state,
            CoordinatorTimelineScreen(eventId: state.pathParameters['id']!),
          ),
        ),
        GoRoute(
          path: '/coordinator/onboarding',
          pageBuilder: (context, state) =>
              _buildPage(context, state, const CoordinatorOnboardingScreen()),
        ),
        ShellRoute(
          builder: (context, state, child) => AdminAppShell(child: child),
          routes: [
            GoRoute(
              path: '/admin/dashboard',
              builder: (context, state) => const AdminDashboardScreen(),
            ),
            GoRoute(
              path: '/admin/users',
              builder: (context, state) => const AdminUsersScreen(),
            ),
            GoRoute(
              path: '/admin/vendors',
              builder: (context, state) => const AdminVendorsScreen(),
            ),
            GoRoute(
              path: '/admin/bookings',
              builder: (context, state) => const AdminBookingsScreen(),
            ),
            GoRoute(
              path: '/admin/reports',
              builder: (context, state) => const AdminReportsScreen(),
            ),
          ],
        ),
        GoRoute(
          path: '/admin/disputes',
          pageBuilder: (context, state) =>
              _buildPage(context, state, const AdminDisputesScreen()),
        ),
        GoRoute(
          path: '/admin/settings',
          pageBuilder: (context, state) =>
              _buildPage(context, state, const AdminSettingsScreen()),
        ),
      ],
    );
