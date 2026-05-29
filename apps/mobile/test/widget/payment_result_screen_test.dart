import 'package:flutter_test/flutter_test.dart';
import 'package:wedding_os/features/payment/payment_result_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  group('PaymentResultScreen', () {
    Widget buildScreen(PaymentResultStatus status, {String? bookingId, String? amount, String? error}) {
      return ProviderScope(
        child: MaterialApp(
          home: PaymentResultScreen(
            status: status,
            bookingId: bookingId,
            amount: amount,
            errorMessage: error,
          ),
        ),
      );
    }

    testWidgets('shows success title and amount', (tester) async {
      await tester.pumpWidget(buildScreen(
        PaymentResultStatus.success,
        bookingId: 'bk1',
        amount: '30,000',
      ));
      expect(find.text('Payment Successful!'), findsOneWidget);
      expect(find.text('₹30,000 paid'), findsOneWidget);
      expect(find.text('View Booking'), findsOneWidget);
    });

    testWidgets('shows failure title and retry button', (tester) async {
      await tester.pumpWidget(buildScreen(
        PaymentResultStatus.failure,
        error: 'Payment declined by bank.',
      ));
      expect(find.text('Payment Failed'), findsOneWidget);
      expect(find.text('Payment declined by bank.'), findsOneWidget);
      expect(find.text('Try Again'), findsOneWidget);
    });

    testWidgets('shows pending title', (tester) async {
      await tester.pumpWidget(buildScreen(PaymentResultStatus.pending));
      expect(find.text('Payment Pending'), findsOneWidget);
      expect(find.text('Check Bookings'), findsOneWidget);
    });
  });
}
