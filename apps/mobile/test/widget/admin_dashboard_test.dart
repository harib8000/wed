import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wedding_os/core/theme.dart';
import 'package:wedding_os/features/admin_dashboard/admin_dashboard_screen.dart';
import 'package:wedding_os/models/admin.dart';
import 'package:wedding_os/providers/admin_provider.dart';

void main() {
  const mockStats = AdminStats(
    totalUsers: 12000,
    activeVendors: 1200,
    todayBookings: 42,
    revenueTodayPaise: 5000000,
    pendingKyc: 7,
    openDisputes: 2,
  );

  Widget buildSubject({
    AsyncValue<AdminStats> stats = const AsyncData(mockStats),
    AsyncValue<List<ActivityFeedItem>> activity = const AsyncData([]),
  }) {
    return ProviderScope(
      overrides: [
        adminStatsProvider.overrideWith((_) => Future.value(stats.value!)),
        adminActivityProvider.overrideWith((_) => Future.value(activity.value ?? [])),
      ],
      child: MaterialApp(
        theme: AppTheme.light,
        home: const AdminDashboardScreen(),
      ),
    );
  }

  group('AdminDashboardScreen', () {
    testWidgets('renders all six KPI cards', (tester) async {
      await tester.pumpWidget(buildSubject());
      await tester.pump();

      expect(find.text('Total Users'), findsOneWidget);
      expect(find.text('Active Vendors'), findsOneWidget);
      expect(find.text("Today's Bookings"), findsOneWidget);
      expect(find.text("Today's Revenue"), findsOneWidget);
      expect(find.text('Pending KYC'), findsOneWidget);
      expect(find.text('Open Disputes'), findsOneWidget);
    });

    testWidgets('renders correct stat values', (tester) async {
      await tester.pumpWidget(buildSubject());
      await tester.pump();

      // NumberFormat.compact formats: 12000 → '12K', 1200 → '1.2K', 42 → '42'
      expect(find.text('12K'), findsOneWidget);
      expect(find.text('42'), findsOneWidget);
      expect(find.text('7'), findsOneWidget);
      expect(find.text('2'), findsOneWidget);
    });

    testWidgets('renders nav tiles for quick navigation', (tester) async {
      await tester.pumpWidget(buildSubject());
      await tester.pump();

      expect(find.text('Users'), findsWidgets);
      expect(find.text('Vendors'), findsWidgets);
    });

    testWidgets('shows loading indicator while stats loading', (tester) async {
      await tester.pumpWidget(ProviderScope(
        overrides: [
          adminStatsProvider.overrideWith((_) => Future.delayed(const Duration(hours: 1), () => throw Exception())),
          adminActivityProvider.overrideWith((_) => Future.value([])),
        ],
        child: MaterialApp(
          theme: AppTheme.light,
          home: const AdminDashboardScreen(),
        ),
      ));
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsAtLeastNWidgets(1));
    });
  });
}
