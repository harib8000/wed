import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';
import '../../models/vendor_analytics.dart';
import '../../providers/auth_provider.dart';
import '../../providers/vendor_analytics_provider.dart';

class VendorDashboardScreen extends ConsumerWidget {
  const VendorDashboardScreen({super.key});

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final analyticsAsync = ref.watch(vendorAnalyticsProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: analyticsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (analytics) => _DashboardBody(
          analytics: analytics,
          vendorName: user?.name ?? 'Vendor',
          city: user?.city ?? '',
          greeting: _greeting(),
        ),
      ),
    );
  }
}

class _DashboardBody extends StatelessWidget {
  final VendorAnalytics analytics;
  final String vendorName;
  final String city;
  final String greeting;

  const _DashboardBody({
    required this.analytics,
    required this.vendorName,
    required this.city,
    required this.greeting,
  });

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        // ─── Header ───────────────────────────────────
        SliverToBoxAdapter(child: _HeaderSection(
          vendorName: vendorName,
          city: city,
          greeting: greeting,
          revenue: analytics.revenue,
        )),

        // ─── Action Items ─────────────────────────────
        SliverToBoxAdapter(child: _ActionItems(bookings: analytics.bookings)),

        // ─── Conversion Funnel ────────────────────────
        SliverToBoxAdapter(child: _ConversionFunnel(bookings: analytics.bookings)),

        // ─── Revenue Chart ────────────────────────────
        SliverToBoxAdapter(child: _RevenueChart(data: analytics.monthlyRevenue)),

        // ─── Performance Snapshot ─────────────────────
        SliverToBoxAdapter(child: _PerformanceGrid(perf: analytics.performance)),

        // ─── Upcoming Events ──────────────────────────
        SliverToBoxAdapter(child: _UpcomingEvents()),

        // ─── Activity Feed ────────────────────────────
        SliverToBoxAdapter(child: _ActivityFeed(items: analytics.recentActivity)),

        const SliverToBoxAdapter(child: SizedBox(height: 24)),
      ],
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// HEADER
// ──────────────────────────────────────────────────────────────────────────────

class _HeaderSection extends StatelessWidget {
  final String vendorName, city, greeting;
  final RevenueMetrics revenue;

  const _HeaderSection({required this.vendorName, required this.city, required this.greeting, required this.revenue});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1E1B4B), Color(0xFF312E81)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(28),
          bottomRight: Radius.circular(28),
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top row
              Row(
                children: [
                  Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [AppColors.brand, Color(0xFFE879F9)]),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Center(
                      child: Text(vendorName.isNotEmpty ? vendorName[0] : 'V',
                          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(greeting, style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 12)),
                        Text(vendorName, style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                  // Notification bell
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Stack(
                      children: [
                        IconButton(icon: const Icon(Icons.notifications_outlined, color: Colors.white, size: 22), onPressed: () {}),
                        Positioned(
                          right: 8, top: 8,
                          child: Container(
                            width: 8, height: 8,
                            decoration: const BoxDecoration(color: Color(0xFFEF4444), shape: BoxShape.circle),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // Revenue KPI Cards
              Row(
                children: [
                  Expanded(child: _KPICard(
                    label: 'Today',
                    value: _formatCurrency(revenue.todayPaise),
                    icon: Icons.today,
                    color: const Color(0xFF34D399),
                  )),
                  const SizedBox(width: 10),
                  Expanded(child: _KPICard(
                    label: 'This Week',
                    value: _formatCurrency(revenue.weekPaise),
                    icon: Icons.date_range,
                    color: const Color(0xFF60A5FA),
                  )),
                  const SizedBox(width: 10),
                  Expanded(child: _KPICard(
                    label: 'Month',
                    value: _formatCurrency(revenue.monthPaise ~/ 100),
                    icon: Icons.calendar_month,
                    color: const Color(0xFFFBBF24),
                    badge: '+${revenue.monthOverMonthGrowth.toStringAsFixed(0)}%',
                  )),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _KPICard extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  final String? badge;

  const _KPICard({required this.label, required this.value, required this.icon, required this.color, this.badge});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 14),
              const SizedBox(width: 4),
              Text(label, style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
              if (badge != null) ...[
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                  decoration: BoxDecoration(color: color.withOpacity(0.2), borderRadius: BorderRadius.circular(4)),
                  child: Text(badge!, style: TextStyle(color: color, fontSize: 8, fontWeight: FontWeight.w700)),
                ),
              ],
            ],
          ),
          const SizedBox(height: 6),
          Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// ACTION ITEMS
// ──────────────────────────────────────────────────────────────────────────────

class _ActionItems extends StatelessWidget {
  final BookingMetrics bookings;
  const _ActionItems({required this.bookings});

  @override
  Widget build(BuildContext context) {
    final pending = bookings.totalEnquiries - bookings.quotedCount - bookings.confirmedCount - bookings.completedCount - bookings.cancelledCount;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.flash_on, color: Colors.orange, size: 20),
              SizedBox(width: 6),
              Text('Needs Your Attention', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _ActionChip(
                icon: Icons.mail_outline,
                count: 3,
                label: 'New\nEnquiries',
                color: const Color(0xFFF97316),
                onTap: () => context.go('/vendor/bookings'),
              )),
              const SizedBox(width: 10),
              Expanded(child: _ActionChip(
                icon: Icons.reply,
                count: 2,
                label: 'Pending\nQuotes',
                color: const Color(0xFF3B82F6),
                onTap: () {},
              )),
              const SizedBox(width: 10),
              Expanded(child: _ActionChip(
                icon: Icons.rate_review_outlined,
                count: 1,
                label: 'Unreplied\nReviews',
                color: const Color(0xFF8B5CF6),
                onTap: () {},
              )),
              const SizedBox(width: 10),
              Expanded(child: _ActionChip(
                icon: Icons.event,
                count: bookings.activeCount,
                label: 'Upcoming\nEvents',
                color: const Color(0xFF10B981),
                onTap: () {},
              )),
            ],
          ),
        ],
      ),
    );
  }
}

class _ActionChip extends StatelessWidget {
  final IconData icon;
  final int count;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionChip({required this.icon, required this.count, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
          boxShadow: [BoxShadow(color: color.withOpacity(0.06), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Column(
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                  child: Icon(icon, color: color, size: 20),
                ),
                if (count > 0)
                  Positioned(
                    right: -4, top: -4,
                    child: Container(
                      width: 18, height: 18,
                      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                      child: Center(child: Text('$count', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700))),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(label, textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 10, color: AppColors.textSecondary, height: 1.2)),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// CONVERSION FUNNEL
// ──────────────────────────────────────────────────────────────────────────────

class _ConversionFunnel extends StatelessWidget {
  final BookingMetrics bookings;
  const _ConversionFunnel({required this.bookings});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Conversion Funnel', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text('${bookings.conversionRate.toStringAsFixed(1)}% rate',
                    style: const TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _FunnelBar(label: 'Enquiries', count: bookings.totalEnquiries, maxCount: bookings.totalEnquiries, color: const Color(0xFFF97316)),
          _FunnelBar(label: 'Quoted', count: bookings.quotedCount, maxCount: bookings.totalEnquiries, color: const Color(0xFF3B82F6)),
          _FunnelBar(label: 'Confirmed', count: bookings.confirmedCount, maxCount: bookings.totalEnquiries, color: const Color(0xFF10B981)),
          _FunnelBar(label: 'Completed', count: bookings.completedCount, maxCount: bookings.totalEnquiries, color: AppColors.brand),
        ],
      ),
    );
  }
}

class _FunnelBar extends StatelessWidget {
  final String label;
  final int count;
  final int maxCount;
  final Color color;

  const _FunnelBar({required this.label, required this.count, required this.maxCount, required this.color});

  @override
  Widget build(BuildContext context) {
    final fraction = maxCount > 0 ? count / maxCount : 0.0;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          SizedBox(width: 72, child: Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary))),
          Expanded(
            child: Stack(
              children: [
                Container(
                  height: 22,
                  decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(6)),
                ),
                FractionallySizedBox(
                  widthFactor: fraction,
                  child: Container(
                    height: 22,
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: color.withOpacity(0.3)),
                    ),
                    alignment: Alignment.centerLeft,
                    padding: const EdgeInsets.only(left: 8),
                    child: Text('$count', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// REVENUE CHART (custom painted)
// ──────────────────────────────────────────────────────────────────────────────

class _RevenueChart extends StatelessWidget {
  final List<MonthlyRevenue> data;
  const _RevenueChart({required this.data});

  @override
  Widget build(BuildContext context) {
    final maxRev = data.fold<int>(0, (m, d) => d.revenuePaise > m ? d.revenuePaise : m);

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Revenue Trend', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              Text('Last 7 months', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 140,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: data.asMap().entries.map((entry) {
                final i = entry.key;
                final d = entry.value;
                final h = maxRev > 0 ? (d.revenuePaise / maxRev * 100) : 0.0;
                final isHighest = d.revenuePaise == maxRev;

                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        if (isHighest)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Text(_formatCurrency(d.revenuePaise),
                                style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w700, color: AppColors.brand)),
                          ),
                        Container(
                          height: h,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.bottomCenter,
                              end: Alignment.topCenter,
                              colors: isHighest
                                  ? [AppColors.brand, const Color(0xFFE879F9)]
                                  : [AppColors.brand.withOpacity(0.3), AppColors.brand.withOpacity(0.15)],
                            ),
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(d.month, style: TextStyle(
                          fontSize: 10,
                          color: isHighest ? AppColors.brand : AppColors.textMuted,
                          fontWeight: isHighest ? FontWeight.w700 : FontWeight.normal,
                        )),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PERFORMANCE GRID
// ──────────────────────────────────────────────────────────────────────────────

class _PerformanceGrid extends StatelessWidget {
  final PerformanceMetrics perf;
  const _PerformanceGrid({required this.perf});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Performance Snapshot', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _PerfCard(
                icon: Icons.star_rounded,
                value: perf.avgRating.toStringAsFixed(1),
                label: 'Avg Rating',
                sub: '${perf.totalReviews} reviews',
                color: const Color(0xFFF59E0B),
              )),
              const SizedBox(width: 10),
              Expanded(child: _PerfCard(
                icon: Icons.visibility_outlined,
                value: _formatNumber(perf.profileViews),
                label: 'Profile Views',
                sub: '+${perf.profileViewsChange}% vs last month',
                color: const Color(0xFF3B82F6),
              )),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(child: _PerfCard(
                icon: Icons.speed_rounded,
                value: '${perf.responseRate.toStringAsFixed(0)}%',
                label: 'Response Rate',
                sub: 'Avg ${perf.avgResponseMinutes}min reply',
                color: const Color(0xFF10B981),
              )),
              const SizedBox(width: 10),
              Expanded(child: _PerfCard(
                icon: Icons.repeat_rounded,
                value: '${perf.repeatCustomers}',
                label: 'Repeat Clients',
                sub: 'Trust builder',
                color: const Color(0xFF8B5CF6),
              )),
            ],
          ),
        ],
      ),
    );
  }
}

class _PerfCard extends StatelessWidget {
  final IconData icon;
  final String value, label, sub;
  final Color color;

  const _PerfCard({required this.icon, required this.value, required this.label, required this.sub, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                child: Icon(icon, size: 16, color: color),
              ),
              const Spacer(),
              Text(value, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 20, color: color)),
            ],
          ),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
          const SizedBox(height: 2),
          Text(sub, style: const TextStyle(color: AppColors.textMuted, fontSize: 10)),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// UPCOMING EVENTS
// ──────────────────────────────────────────────────────────────────────────────

class _UpcomingEvents extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Upcoming Events', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              Text('This Month →', style: TextStyle(color: AppColors.brand, fontSize: 12, fontWeight: FontWeight.w500)),
            ],
          ),
          const SizedBox(height: 12),
          _EventRow(
            emoji: '💒',
            title: 'Nithya & Ravi Wedding',
            date: 'Feb 5 · Full Day',
            status: 'In 3 days',
            statusColor: const Color(0xFFEF4444),
          ),
          _EventRow(
            emoji: '🎉',
            title: 'Swathi & Ganesh Reception',
            date: 'Feb 8 · 6 PM - 11 PM',
            status: 'In 6 days',
            statusColor: const Color(0xFFF97316),
          ),
          _EventRow(
            emoji: '💍',
            title: 'Sneha & Karthik Reception',
            date: 'Feb 20 · Full Day',
            status: 'In 18 days',
            statusColor: const Color(0xFF3B82F6),
          ),
        ],
      ),
    );
  }
}

class _EventRow extends StatelessWidget {
  final String emoji, title, date, status;
  final Color statusColor;

  const _EventRow({required this.emoji, required this.title, required this.date, required this.status, required this.statusColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(child: Text(emoji, style: const TextStyle(fontSize: 18))),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                Text(date, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(status, style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// ACTIVITY FEED
// ──────────────────────────────────────────────────────────────────────────────

class _ActivityFeed extends StatelessWidget {
  final List<ActivityItem> items;
  const _ActivityFeed({required this.items});

  IconData _iconFor(ActivityType t) {
    switch (t) {
      case ActivityType.enquiry: return Icons.mail_outline;
      case ActivityType.booking: return Icons.event_available;
      case ActivityType.payment: return Icons.account_balance_wallet;
      case ActivityType.review: return Icons.star_outline;
      case ActivityType.profile: return Icons.person_outline;
    }
  }

  Color _colorFor(ActivityType t) {
    switch (t) {
      case ActivityType.enquiry: return const Color(0xFFF97316);
      case ActivityType.booking: return const Color(0xFF10B981);
      case ActivityType.payment: return AppColors.brand;
      case ActivityType.review: return const Color(0xFFF59E0B);
      case ActivityType.profile: return const Color(0xFF3B82F6);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Recent Activity', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          const SizedBox(height: 12),
          ...items.take(6).map((item) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(
                    color: _colorFor(item.type).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(_iconFor(item.type), size: 16, color: _colorFor(item.type)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                      Text(item.subtitle, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                    ],
                  ),
                ),
                Text(item.timeAgo, style: const TextStyle(color: AppColors.textMuted, fontSize: 10)),
              ],
            ),
          )),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// UTILS
// ──────────────────────────────────────────────────────────────────────────────

String _formatCurrency(int paise) {
  final rupees = paise ~/ 100;
  if (rupees >= 10000000) return '₹${(rupees / 10000000).toStringAsFixed(1)}Cr';
  if (rupees >= 100000) return '₹${(rupees / 100000).toStringAsFixed(1)}L';
  if (rupees >= 1000) return '₹${(rupees / 1000).toStringAsFixed(1)}K';
  return '₹$rupees';
}

String _formatNumber(int n) {
  if (n >= 10000000) return '${(n / 10000000).toStringAsFixed(1)}Cr';
  if (n >= 100000) return '${(n / 100000).toStringAsFixed(1)}L';
  if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
  return '$n';
}
