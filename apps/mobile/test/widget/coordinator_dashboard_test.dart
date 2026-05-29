import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wedding_os/core/theme.dart';
import 'package:wedding_os/features/coordinator_dashboard/coordinator_dashboard_screen.dart';
import 'package:wedding_os/models/coordinator.dart';
import 'package:wedding_os/providers/coordinator_provider.dart';

void main() {
  Widget buildSubject({
    AsyncValue<CoordinatorStats> stats = const AsyncData(CoordinatorStats(
      activeEventsToday: 2,
      pendingTasks: 5,
      upcomingMilestones: 3,
      openChats: 4,
      totalEventsManaged: 8,
      completedThisMonth: 1,
    )),
    AsyncValue<List<CoordinatorEvent>> events = const AsyncData([]),
  }) {
    return ProviderScope(
      overrides: [
        coordinatorStatsProvider.overrideWith((_) => Future.value(stats.value!)),
        coordinatorEventsProvider.overrideWith((_) => Future.value(events.value ?? [])),
      ],
      child: MaterialApp(
        theme: AppTheme.light,
        home: const CoordinatorDashboardScreen(),
      ),
    );
  }

  group('CoordinatorDashboardScreen', () {
    testWidgets('renders KPI cards with correct values', (tester) async {
      await tester.pumpWidget(buildSubject());
      await tester.pump(); // allow FutureProvider to resolve

      // Header greeting
      expect(find.textContaining('Good'), findsOneWidget);

      // KPI cards
      expect(find.text('Events Today'), findsOneWidget);
      expect(find.text('2'), findsOneWidget);
      expect(find.text('Pending Tasks'), findsOneWidget);
      expect(find.text('5'), findsOneWidget);
    });

    testWidgets('renders quick action buttons', (tester) async {
      await tester.pumpWidget(buildSubject());
      await tester.pump();

      expect(find.text('New Task'), findsOneWidget);
      expect(find.text('Msg Vendor'), findsOneWidget);
      expect(find.text('Timeline'), findsOneWidget);
    });

    testWidgets('shows empty events state when no events', (tester) async {
      await tester.pumpWidget(buildSubject(events: const AsyncData([])));
      await tester.pump();

      expect(find.text('No upcoming events'), findsOneWidget);
    });

    testWidgets('renders loading indicator while stats loading', (tester) async {
      await tester.pumpWidget(ProviderScope(
        overrides: [
          coordinatorStatsProvider.overrideWith((_) => Future.delayed(const Duration(hours: 1), () => throw Exception())),
          coordinatorEventsProvider.overrideWith((_) => Future.value([])),
        ],
        child: MaterialApp(
          theme: AppTheme.light,
          home: const CoordinatorDashboardScreen(),
        ),
      ));
      await tester.pump(); // don't complete the future

      expect(find.byType(CircularProgressIndicator), findsAtLeastNWidgets(1));
    });
  });
}
