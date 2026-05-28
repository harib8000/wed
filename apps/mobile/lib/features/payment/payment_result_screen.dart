import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

enum PaymentResultStatus { success, failure, pending }

/// Dedicated payment result screen shown after Razorpay callback.
/// Navigate to this screen using:
///   context.go('/payment/result?status=success&bookingId=...&amount=...')
class PaymentResultScreen extends StatelessWidget {
  final PaymentResultStatus status;
  final String? bookingId;
  final String? amount;
  final String? errorMessage;

  const PaymentResultScreen({
    super.key,
    required this.status,
    this.bookingId,
    this.amount,
    this.errorMessage,
  });

  @override
  Widget build(BuildContext context) {
    final config = _config(status);
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Spacer(),

              // ─── Status icon ─────────────────────
              Semantics(
                label: config.semanticsLabel,
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: config.color.withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(config.icon, size: 64, color: config.color),
                ),
              ),
              const SizedBox(height: 32),

              // ─── Title & message ─────────────────
              Text(config.title, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 12),
              Text(
                config.message,
                style: Theme.of(context).textTheme.bodyLarge,
                textAlign: TextAlign.center,
              ),

              // ─── Amount badge ────────────────────
              if (amount != null && status == PaymentResultStatus.success) ...[
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  decoration: BoxDecoration(
                    color: AppColors.success.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '₹$amount paid',
                    style: TextStyle(
                      color: AppColors.success,
                      fontWeight: FontWeight.bold,
                      fontSize: 20,
                    ),
                  ),
                ),
              ],

              // ─── Error detail ────────────────────
              if (errorMessage != null && status == PaymentResultStatus.failure) ...[
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.error.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.error.withOpacity(0.2)),
                  ),
                  child: Text(
                    errorMessage!,
                    style: TextStyle(color: AppColors.error, fontSize: 13),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],

              const Spacer(),

              // ─── CTAs ────────────────────────────
              if (status == PaymentResultStatus.success) ...[
                if (bookingId != null)
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => context.go('/bookings/$bookingId'),
                      child: const Text('View Booking'),
                    ),
                  ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () => context.go('/'),
                    child: const Text('Go to Home'),
                  ),
                ),
              ] else if (status == PaymentResultStatus.failure) ...[
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
                    child: const Text('Try Again'),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () => context.go('/'),
                    child: const Text('Go to Home'),
                  ),
                ),
              ] else ...[
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => context.go('/bookings'),
                    child: const Text('Check Bookings'),
                  ),
                ),
              ],

              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  _StatusConfig _config(PaymentResultStatus s) {
    return switch (s) {
      PaymentResultStatus.success => _StatusConfig(
          icon: Icons.check_circle_outline,
          color: AppColors.success,
          title: 'Payment Successful!',
          message: 'Your advance payment has been received and held in escrow. The vendor will confirm shortly.',
          semanticsLabel: 'Payment successful',
        ),
      PaymentResultStatus.failure => _StatusConfig(
          icon: Icons.cancel_outlined,
          color: AppColors.error,
          title: 'Payment Failed',
          message: 'We could not process your payment. No amount has been charged. Please try again.',
          semanticsLabel: 'Payment failed',
        ),
      PaymentResultStatus.pending => _StatusConfig(
          icon: Icons.hourglass_empty_outlined,
          color: AppColors.gold,
          title: 'Payment Pending',
          message: 'Your payment is being processed. We will notify you once it is confirmed.',
          semanticsLabel: 'Payment pending',
        ),
    };
  }
}

class _StatusConfig {
  final IconData icon;
  final Color color;
  final String title;
  final String message;
  final String semanticsLabel;

  const _StatusConfig({
    required this.icon,
    required this.color,
    required this.title,
    required this.message,
    required this.semanticsLabel,
  });
}
