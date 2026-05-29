import 'package:flutter_test/flutter_test.dart';
import 'package:wedding_os/shared/widgets/empty_state_widget.dart';
import 'package:wedding_os/shared/widgets/error_state_widget.dart';
import 'package:flutter/material.dart';

void main() {
  group('EmptyStateWidget', () {
    testWidgets('renders title, message, and action button', (tester) async {
      bool tapped = false;
      await tester.pumpWidget(MaterialApp(
        home: Scaffold(
          body: EmptyStateWidget(
            icon: Icons.inbox,
            title: 'Nothing here',
            message: 'Add some items to get started.',
            actionLabel: 'Add Item',
            onAction: () => tapped = true,
          ),
        ),
      ));
      expect(find.text('Nothing here'), findsOneWidget);
      expect(find.text('Add some items to get started.'), findsOneWidget);
      expect(find.text('Add Item'), findsOneWidget);

      await tester.tap(find.text('Add Item'));
      expect(tapped, true);
    });

    testWidgets('renders without action button when not provided', (tester) async {
      await tester.pumpWidget(const MaterialApp(
        home: Scaffold(
          body: EmptyStateWidget(
            icon: Icons.inbox,
            title: 'Nothing here',
            message: 'No items.',
          ),
        ),
      ));
      expect(find.text('Nothing here'), findsOneWidget);
      expect(find.byType(ElevatedButton), findsNothing);
    });
  });

  group('ErrorStateWidget', () {
    testWidgets('renders message and retry button', (tester) async {
      bool retried = false;
      await tester.pumpWidget(MaterialApp(
        home: Scaffold(
          body: ErrorStateWidget(
            message: 'Network error',
            onRetry: () => retried = true,
          ),
        ),
      ));
      expect(find.text('Oops!'), findsOneWidget);
      expect(find.text('Network error'), findsOneWidget);

      await tester.tap(find.text('Try Again'));
      expect(retried, true);
    });

    testWidgets('renders without retry when onRetry is null', (tester) async {
      await tester.pumpWidget(const MaterialApp(
        home: Scaffold(
          body: ErrorStateWidget(),
        ),
      ));
      expect(find.text('Oops!'), findsOneWidget);
      expect(find.byType(ElevatedButton), findsNothing);
    });
  });
}
