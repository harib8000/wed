import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';
import '../../providers/coordinator_provider.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/error_state_widget.dart';

class CoordinatorVendorsScreen extends ConsumerWidget {
  const CoordinatorVendorsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vendorsAsync = ref.watch(coordinatorVendorsProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Vendors'),
        backgroundColor: AppColors.coordinator,
        foregroundColor: Colors.white,
        titleTextStyle: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: () => ref.invalidate(coordinatorVendorsProvider),
          ),
        ],
      ),
      body: vendorsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ErrorStateWidget(
          message: 'Failed to load vendors.',
          onRetry: () => ref.invalidate(coordinatorVendorsProvider),
        ),
        data: (vendors) {
          if (vendors.isEmpty) {
            return const EmptyStateWidget(
              icon: Icons.storefront_outlined,
              title: 'No Vendors',
              message: 'No vendors are linked to your events yet.',
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

class _VendorTile extends StatelessWidget {
  final Map<String, dynamic> vendor;
  const _VendorTile({required this.vendor});

  @override
  Widget build(BuildContext context) {
    final id = vendor['id'] as String? ?? '';
    final name = vendor['businessName'] as String? ?? 'Vendor';
    final category = vendor['category'] as String? ?? '';
    final city = vendor['city'] as String? ?? '';

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: AppColors.border),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => context.push('/chat/$id'),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.coordinatorLight,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.storefront, color: AppColors.coordinator, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    const SizedBox(height: 2),
                    Row(children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.coordinatorLight,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(category,
                            style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: AppColors.coordinator)),
                      ),
                      if (city.isNotEmpty) ...[
                        const SizedBox(width: 8),
                        Text(city, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                      ],
                    ]),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.message_outlined, color: AppColors.coordinator),
                onPressed: () => context.push('/chat/$id'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
