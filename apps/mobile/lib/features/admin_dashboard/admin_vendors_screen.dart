import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../models/admin.dart';
import '../../providers/admin_provider.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/error_state_widget.dart';

class AdminVendorsScreen extends ConsumerWidget {
  const AdminVendorsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vendorsAsync = ref.watch(adminVendorsProvider);
    final filter = ref.watch(adminVendorsFilterProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Vendors'),
        backgroundColor: AppColors.admin,
        foregroundColor: Colors.white,
        titleTextStyle: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: () => ref.invalidate(adminVendorsProvider),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: _KycFilterRow(
              selected: filter.kycStatus,
              onSelected: (status) => ref
                  .read(adminVendorsFilterProvider.notifier)
                  .state = AdminVendorsFilter(kycStatus: status),
            ),
          ),
        ),
      ),
      body: vendorsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ErrorStateWidget(
          message: 'Failed to load vendors.',
          onRetry: () => ref.invalidate(adminVendorsProvider),
        ),
        data: (vendors) {
          if (vendors.isEmpty) {
            return const EmptyStateWidget(
              icon: Icons.storefront_outlined,
              title: 'No Vendors',
              message: 'No vendors match the current filter.',
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: vendors.length,
            itemBuilder: (ctx, i) => _VendorTile(vendor: vendors[i]),
          );
        },
      ),
    );
  }
}

class _KycFilterRow extends StatelessWidget {
  final String? selected;
  final ValueChanged<String?> onSelected;
  const _KycFilterRow({required this.selected, required this.onSelected});

  @override
  Widget build(BuildContext context) {
    const statuses = ['PENDING', 'APPROVED', 'REJECTED'];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _FilterChip(label: 'All', selected: selected == null, onTap: () => onSelected(null)),
          ...statuses.map((s) => Padding(
                padding: const EdgeInsets.only(left: 8),
                child: _FilterChip(
                  label: s[0] + s.substring(1).toLowerCase(),
                  selected: selected == s,
                  onTap: () => onSelected(s),
                ),
              )),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _FilterChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? Colors.white : Colors.white.withOpacity(0.2),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: selected ? AppColors.admin : Colors.white,
          ),
        ),
      ),
    );
  }
}

class _VendorTile extends ConsumerWidget {
  final AdminVendor vendor;
  const _VendorTile({required this.vendor});

  Color get _kycColor {
    switch (vendor.kycStatus) {
      case 'APPROVED':
        return AppColors.success;
      case 'REJECTED':
        return AppColors.error;
      default:
        return AppColors.gold;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: AppColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.adminLight,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.storefront, color: AppColors.admin, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(vendor.businessName,
                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                          ),
                          if (vendor.isFeatured)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.gold.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text('FEATURED',
                                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.gold)),
                            ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Row(children: [
                        Text(vendor.category,
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                        const Text(' · ', style: TextStyle(color: AppColors.textMuted)),
                        Text(vendor.city,
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                      ]),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _kycColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(vendor.kycStatus,
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: _kycColor)),
                ),
              ],
            ),
            if (vendor.kycStatus == 'PENDING') ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        try {
                          await ApiClient.rejectKyc(vendor.id, 'Documents insufficient');
                          ref.invalidate(adminVendorsProvider);
                        } catch (_) {}
                      },
                      icon: const Icon(Icons.close, size: 14),
                      label: const Text('Reject'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                        side: const BorderSide(color: AppColors.error),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        try {
                          await ApiClient.approveKyc(vendor.id);
                          ref.invalidate(adminVendorsProvider);
                        } catch (_) {}
                      },
                      icon: const Icon(Icons.check, size: 14),
                      label: const Text('Approve'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.success,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
