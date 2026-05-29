import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../models/admin.dart';
import '../../providers/admin_provider.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/error_state_widget.dart';
import '../../shared/widgets/shimmer_state_widget.dart';
class AdminDisputesScreen extends ConsumerWidget {
  const AdminDisputesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final disputesAsync = ref.watch(adminDisputesProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Disputes'),
        backgroundColor: AppColors.admin,
        foregroundColor: Colors.white,
        titleTextStyle: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: () => ref.invalidate(adminDisputesProvider),
          ),
        ],
      ),
      body: disputesAsync.when(
        loading: () => const ShimmerStateWidget(itemCount: 4, itemHeight: 116),
        error: (e, _) => ErrorStateWidget(
          message: 'Failed to load disputes.',
          onRetry: () => ref.invalidate(adminDisputesProvider),
        ),
        data: (disputes) {
          if (disputes.isEmpty) {
            return const EmptyStateWidget(
              icon: Icons.gavel_outlined,
              title: 'No Open Disputes',
              message: 'All disputes have been resolved.',
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: disputes.length,
            itemBuilder: (ctx, i) => _DisputeTile(dispute: disputes[i]),
          );
        },
      ),
    );
  }
}

class _DisputeTile extends ConsumerWidget {
  final AdminDispute dispute;
  const _DisputeTile({required this.dispute});

  String _rupees(int paise) {
    final val = paise ~/ 100;
    return '₹${NumberFormat('#,##,###').format(val)}';
  }

  String _timeAgo(String iso) {
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt);
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  Future<void> _resolve(BuildContext context, WidgetRef ref, String action) async {
    try {
      await ApiClient.resolveDispute(dispute.id, action);
      ref.invalidate(adminDisputesProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Dispute $action action applied.')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to resolve dispute.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: AppColors.error.withOpacity(0.3)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: AppColors.error.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.gavel, color: AppColors.error, size: 18),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(dispute.bookingNumber,
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                      Text(
                        'Raised by ${dispute.raiserName} (${dispute.raisedBy})',
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
                Text(_timeAgo(dispute.createdAt),
                    style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
              ],
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.error.withOpacity(0.05),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(dispute.reason,
                  style: const TextStyle(fontSize: 13, color: AppColors.textPrimary)),
            ),
            const SizedBox(height: 4),
            Text('Amount in dispute: ${_rupees(dispute.amountPaise)}',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _resolve(context, ref, 'REFUND_CUSTOMER'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.coordinator,
                      side: const BorderSide(color: AppColors.coordinator),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      textStyle: const TextStyle(fontSize: 11),
                    ),
                    child: const Text('Refund Customer'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _resolve(context, ref, 'RELEASE_TO_VENDOR'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.success,
                      side: const BorderSide(color: AppColors.success),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      textStyle: const TextStyle(fontSize: 11),
                    ),
                    child: const Text('Release to Vendor'),
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton(
                  onPressed: () => _resolve(context, ref, 'CLOSE'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.textMuted,
                    side: const BorderSide(color: AppColors.border),
                    padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                    textStyle: const TextStyle(fontSize: 11),
                  ),
                  child: const Text('Close'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
