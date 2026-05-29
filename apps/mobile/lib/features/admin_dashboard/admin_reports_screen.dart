import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/theme.dart';
import '../../models/admin.dart';
import '../../providers/admin_provider.dart';
import '../../shared/widgets/error_state_widget.dart';
import '../../shared/widgets/shimmer_state_widget.dart';

class AdminReportsScreen extends ConsumerWidget {
  const AdminReportsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reportsAsync = ref.watch(platformReportsProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Reports'),
        backgroundColor: AppColors.admin,
        foregroundColor: Colors.white,
        titleTextStyle: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, color: Colors.white),
            onPressed: () => _exportReport(context, reportsAsync.value),
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: () => ref.invalidate(platformReportsProvider),
          ),
        ],
      ),
      body: reportsAsync.when(
        loading: () => const ShimmerStateWidget(itemCount: 4, itemHeight: 128),
        error: (e, _) => ErrorStateWidget(
          message: 'Failed to load reports.',
          onRetry: () => ref.invalidate(platformReportsProvider),
        ),
        data: (report) => _ReportBody(report: report),
      ),
    );
  }

  void _exportReport(BuildContext context, PlatformReport? report) {
    if (report == null) return;
    final buffer = StringBuffer();
    buffer.writeln('WeddingOS Platform Report');
    buffer.writeln('========================');
    buffer.writeln('Total Bookings: ${report.totalBookings}');
    buffer.writeln('Total Revenue: ₹${report.totalRevenuePaise ~/ 100}');
    buffer.writeln();
    buffer.writeln('Monthly Revenue:');
    for (final m in report.monthlyRevenue) {
      buffer.writeln('  ${m.month}: ₹${m.revenuePaise ~/ 100} (${m.bookingCount} bookings)');
    }
    buffer.writeln();
    buffer.writeln('Category Breakdown:');
    report.categoryBreakdown.forEach((k, v) => buffer.writeln('  $k: $v'));
    buffer.writeln();
    buffer.writeln('City Distribution:');
    report.cityDistribution.forEach((k, v) => buffer.writeln('  $k: $v'));

    Share.share(buffer.toString(), subject: 'WeddingOS Platform Report');
  }
}

class _ReportBody extends StatelessWidget {
  final PlatformReport report;
  const _ReportBody({required this.report});

  String _rupees(int paise) {
    final val = paise ~/ 100;
    if (val >= 10000000) return '₹${(val / 10000000).toStringAsFixed(1)}Cr';
    if (val >= 100000) return '₹${(val / 100000).toStringAsFixed(1)}L';
    return '₹${(val / 1000).toStringAsFixed(1)}K';
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Summary Cards
        Row(
          children: [
            Expanded(
              child: _SummaryCard(
                label: 'Total Revenue',
                value: _rupees(report.totalRevenuePaise),
                icon: Icons.currency_rupee,
                color: AppColors.admin,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _SummaryCard(
                label: 'Total Bookings',
                value: '${report.totalBookings}',
                icon: Icons.book_outlined,
                color: AppColors.coordinator,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // Monthly Revenue
        Text('Monthly Revenue (6 Months)',
            style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        _RevenueChart(data: report.monthlyRevenue),
        const SizedBox(height: 24),

        // Category Breakdown
        Text('Category Breakdown', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        _BreakdownBar(data: report.categoryBreakdown, color: AppColors.coordinator),
        const SizedBox(height: 24),

        // City Distribution
        Text('City Distribution', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        _BreakdownBar(data: report.cityDistribution, color: AppColors.brand),
        const SizedBox(height: 24),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  const _SummaryCard({required this.label, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}

class _RevenueChart extends StatelessWidget {
  final List<MonthlyRevenuePoint> data;
  const _RevenueChart({required this.data});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) return const SizedBox.shrink();
    final maxRevenue = data.map((d) => d.revenuePaise).reduce((a, b) => a > b ? a : b);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)],
      ),
      child: Column(
        children: [
          SizedBox(
            height: 120,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: data.map((d) {
                final ratio = maxRevenue > 0 ? d.revenuePaise / maxRevenue : 0.0;
                final barH = ratio * 100;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Container(
                          height: barH,
                          decoration: BoxDecoration(
                            color: AppColors.admin,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(d.month,
                            style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: data.map((d) {
              final val = d.revenuePaise ~/ 100;
              String label;
              if (val >= 100000) {
                label = '₹${(val / 100000).toStringAsFixed(1)}L';
              } else {
                label = '₹${(val / 1000).toStringAsFixed(0)}K';
              }
              return Text(label, style: const TextStyle(fontSize: 9, color: AppColors.textMuted));
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _BreakdownBar extends StatelessWidget {
  final Map<String, int> data;
  final Color color;
  const _BreakdownBar({required this.data, required this.color});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) return const SizedBox.shrink();
    final total = data.values.fold(0, (a, b) => a + b);
    final sorted = data.entries.toList()..sort((a, b) => b.value.compareTo(a.value));

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)],
      ),
      child: Column(
        children: sorted.take(5).map((entry) {
          final pct = total > 0 ? entry.value / total : 0.0;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(entry.key, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    Text('${entry.value} (${(pct * 100).toStringAsFixed(1)}%)',
                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                  ],
                ),
                const SizedBox(height: 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: pct,
                    backgroundColor: AppColors.border,
                    valueColor: AlwaysStoppedAnimation<Color>(color),
                    minHeight: 6,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}
