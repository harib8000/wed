import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/theme.dart';
import '../../models/admin.dart';
import '../../providers/admin_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/connectivity_provider.dart';
import '../../shared/widgets/error_state_widget.dart';

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final statsAsync = ref.watch(adminStatsProvider);
    final activityAsync = ref.watch(adminActivityProvider);
    final isOnline = ref.watch(connectivityProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 130,
            pinned: true,
            backgroundColor: AppColors.admin,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFFD97706), Color(0xFFB45309)],
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        const Text('WeddingOS Admin',
                            style: TextStyle(color: Colors.white70, fontSize: 13)),
                        const SizedBox(height: 4),
                        Text(
                          user?.name ?? 'Admin',
                          style: const TextStyle(
                              color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined, color: Colors.white),
                onPressed: () => context.push('/notifications'),
              ),
              IconButton(
                icon: const Icon(Icons.settings_outlined, color: Colors.white),
                onPressed: () => context.push('/admin/settings'),
              ),
            ],
          ),

          if (!isOnline)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: ErrorStateWidget(message: 'Offline – showing cached stats.'),
              ),
            ),

          SliverToBoxAdapter(
            child: statsAsync.when(
              loading: () => const Padding(
                padding: EdgeInsets.all(32),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, _) => Padding(
                padding: const EdgeInsets.all(16),
                child: ErrorStateWidget(
                  message: 'Failed to load stats.',
                  onRetry: () => ref.invalidate(adminStatsProvider),
                ),
              ),
              data: (stats) => _StatsGrid(stats: stats),
            ),
          ),

          // Nav Tiles
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Platform Management',
                      style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 2.2,
                    children: [
                      _NavTile(icon: Icons.people, label: 'Users', color: AppColors.coordinator, onTap: () => context.go('/admin/users')),
                      _NavTile(icon: Icons.storefront, label: 'Vendors', color: AppColors.success, onTap: () => context.go('/admin/vendors')),
                      _NavTile(icon: Icons.book, label: 'Bookings', color: AppColors.brand, onTap: () => context.go('/admin/bookings')),
                      _NavTile(icon: Icons.gavel, label: 'Disputes', color: AppColors.error, onTap: () => context.push('/admin/disputes')),
                    ],
                  ),
                ],
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: Text('Recent Activity', style: Theme.of(context).textTheme.titleLarge),
            ),
          ),

          activityAsync.when(
            loading: () => const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: Center(child: CircularProgressIndicator()),
              ),
            ),
            error: (_, __) => const SliverToBoxAdapter(child: SizedBox.shrink()),
            data: (items) => SliverList(
              delegate: SliverChildBuilderDelegate(
                (ctx, i) => Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: _ActivityTile(item: items[i]),
                ),
                childCount: items.take(8).length,
              ),
            ),
          ),

          const SliverPadding(padding: EdgeInsets.only(bottom: 24)),
        ],
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  final AdminStats stats;
  const _StatsGrid({required this.stats});

  @override
  Widget build(BuildContext context) {
    String _rupees(int paise) {
      final val = paise ~/ 100;
      if (val >= 10000000) return '₹${(val / 10000000).toStringAsFixed(1)}Cr';
      if (val >= 100000) return '₹${(val / 100000).toStringAsFixed(1)}L';
      if (val >= 1000) return '₹${(val / 1000).toStringAsFixed(1)}K';
      return '₹$val';
    }

    return Padding(
      padding: const EdgeInsets.all(16),
      child: GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.3,
        children: [
          _StatCard(label: 'Total Users', value: NumberFormat.compact().format(stats.totalUsers), icon: Icons.people_outline, color: AppColors.coordinator),
          _StatCard(label: 'Active Vendors', value: NumberFormat.compact().format(stats.activeVendors), icon: Icons.storefront_outlined, color: AppColors.success),
          _StatCard(label: "Today's Bookings", value: '${stats.todayBookings}', icon: Icons.book_outlined, color: AppColors.brand),
          _StatCard(label: "Revenue Today", value: _rupees(stats.revenueTodayPaise), icon: Icons.currency_rupee, color: AppColors.admin),
          _StatCard(label: 'Pending KYC', value: '${stats.pendingKyc}', icon: Icons.verified_user_outlined, color: AppColors.gold, isAlert: stats.pendingKyc > 0),
          _StatCard(label: 'Open Disputes', value: '${stats.openDisputes}', icon: Icons.gavel_outlined, color: AppColors.error, isAlert: stats.openDisputes > 0),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final bool isAlert;
  const _StatCard({required this.label, required this.value, required this.icon, required this.color, this.isAlert = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isAlert ? color.withOpacity(0.06) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: isAlert ? Border.all(color: color.withOpacity(0.3)) : null,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, color: color, size: 18),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
              Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
            ],
          ),
        ],
      ),
    );
  }
}

class _NavTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _NavTile({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 8),
            Text(label, style: TextStyle(fontWeight: FontWeight.w600, color: color, fontSize: 13)),
          ],
        ),
      ),
    );
  }
}

class _ActivityTile extends StatelessWidget {
  final ActivityFeedItem item;
  const _ActivityTile({required this.item});

  IconData get _icon {
    switch (item.type) {
      case 'KYC_SUBMITTED':
        return Icons.verified_user_outlined;
      case 'DISPUTE_RAISED':
        return Icons.gavel_outlined;
      case 'BOOKING_CREATED':
        return Icons.book_outlined;
      default:
        return Icons.person_add_outlined;
    }
  }

  Color get _color {
    switch (item.type) {
      case 'KYC_SUBMITTED':
        return AppColors.gold;
      case 'DISPUTE_RAISED':
        return AppColors.error;
      case 'BOOKING_CREATED':
        return AppColors.brand;
      default:
        return AppColors.success;
    }
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(color: _color.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
              child: Icon(_icon, color: _color, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  Text(item.subtitle, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                ],
              ),
            ),
            Text(_timeAgo(item.createdAt), style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
          ],
        ),
      ),
    );
  }
}
