import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';
import '../../models/vendor_analytics.dart';
import '../../providers/vendor_analytics_provider.dart';
import '../../shared/widgets/error_state_widget.dart';
import '../../shared/widgets/shimmer_state_widget.dart';

class VendorAnalyticsScreen extends ConsumerWidget {
  const VendorAnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final analyticsAsync = ref.watch(vendorAnalyticsProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Analytics'),
        automaticallyImplyLeading: false,
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.border),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.calendar_today, size: 14, color: AppColors.textSecondary),
                SizedBox(width: 4),
                Text('Last 30 days', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                SizedBox(width: 2),
                Icon(Icons.arrow_drop_down, size: 16, color: AppColors.textSecondary),
              ],
            ),
          ),
        ],
      ),
      body: analyticsAsync.when(
        loading: () => const ShimmerStateWidget(itemCount: 5, itemHeight: 140),
        error: (e, _) => ErrorStateWidget(
          message: 'Analytics are taking longer than expected to load.',
          onRetry: () => ref.refresh(vendorAnalyticsProvider.future),
        ),
        data: (a) => _AnalyticsBody(analytics: a),
      ),
    );
  }
}

class _AnalyticsBody extends StatelessWidget {
  final VendorAnalytics analytics;
  const _AnalyticsBody({required this.analytics});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ─── Key Metrics ────────────────────────
          _KeyMetricsRow(analytics: analytics),
          const SizedBox(height: 16),

          // ─── Revenue Trend ──────────────────────
          _SectionCard(
            title: 'Revenue Trend',
            subtitle: '7-month overview',
            child: _RevenueAreaChart(data: analytics.monthlyRevenue),
          ),
          const SizedBox(height: 16),

          // ─── Booking Trends ─────────────────────
          _SectionCard(
            title: 'Booking Trends',
            subtitle: 'Monthly bookings',
            child: _BookingBarChart(data: analytics.monthlyRevenue),
          ),
          const SizedBox(height: 16),

          // ─── Package Revenue Split ──────────────
          _SectionCard(
            title: 'Revenue by Package',
            subtitle: 'Which packages earn most',
            child: _PackageDonut(packages: analytics.packageBreakdown),
          ),
          const SizedBox(height: 16),

          // ─── Lead Sources ───────────────────────
          _SectionCard(
            title: 'Lead Sources',
            subtitle: 'Where do your customers come from',
            child: _LeadSourceBars(sources: analytics.leadSources),
          ),
          const SizedBox(height: 16),

          // ─── Rating Distribution ────────────────
          _SectionCard(
            title: 'Rating Distribution',
            subtitle: '${analytics.performance.totalReviews} total reviews',
            child: _RatingDistribution(
              distribution: analytics.performance.ratingDistribution,
              total: analytics.performance.totalReviews,
              avg: analytics.performance.avgRating,
            ),
          ),
          const SizedBox(height: 16),

          // ─── Response Time ──────────────────────
          _SectionCard(
            title: 'Response Performance',
            subtitle: 'How quickly you reply',
            child: _ResponseMetrics(perf: analytics.performance),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// KEY METRICS ROW
// ──────────────────────────────────────────────────────────────────────────────

class _KeyMetricsRow extends StatelessWidget {
  final VendorAnalytics analytics;
  const _KeyMetricsRow({required this.analytics});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 90,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _MetricPill(
            label: 'Conversion Rate',
            value: '${analytics.bookings.conversionRate.toStringAsFixed(1)}%',
            icon: Icons.swap_horiz,
            color: const Color(0xFF10B981),
            trend: '+3.2%',
          ),
          _MetricPill(
            label: 'Avg Booking Value',
            value: _formatCurrency(analytics.bookings.avgBookingValuePaise),
            icon: Icons.payments_outlined,
            color: AppColors.brand,
            trend: '+₹15K',
          ),
          _MetricPill(
            label: 'Active Bookings',
            value: '${analytics.bookings.activeCount}',
            icon: Icons.event_available,
            color: const Color(0xFF3B82F6),
          ),
          _MetricPill(
            label: 'Total Revenue',
            value: _formatCurrency(analytics.revenue.totalPaise),
            icon: Icons.account_balance,
            color: const Color(0xFFF59E0B),
          ),
        ],
      ),
    );
  }
}

class _MetricPill extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  final String? trend;

  const _MetricPill({required this.label, required this.value, required this.icon, required this.color, this.trend});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 155,
      margin: const EdgeInsets.only(right: 10),
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
              Icon(icon, size: 14, color: color),
              const SizedBox(width: 4),
              Expanded(child: Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textMuted), overflow: TextOverflow.ellipsis)),
            ],
          ),
          const Spacer(),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(value, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: color)),
              if (trend != null) ...[
                const SizedBox(width: 6),
                Text(trend!, style: const TextStyle(fontSize: 10, color: Color(0xFF10B981), fontWeight: FontWeight.w600)),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// SECTION CARD
// ──────────────────────────────────────────────────────────────────────────────

class _SectionCard extends StatelessWidget {
  final String title, subtitle;
  final Widget child;

  const _SectionCard({required this.title, required this.subtitle, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
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
              Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              Text(subtitle, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// REVENUE AREA CHART
// ──────────────────────────────────────────────────────────────────────────────

class _RevenueAreaChart extends StatelessWidget {
  final List<MonthlyRevenue> data;
  const _RevenueAreaChart({required this.data});

  @override
  Widget build(BuildContext context) {
    final maxRev = data.fold<int>(0, (m, d) => d.revenuePaise > m ? d.revenuePaise : m);

    return SizedBox(
      height: 160,
      child: CustomPaint(
        painter: _AreaChartPainter(data: data, maxValue: maxRev),
        size: Size.infinite,
      ),
    );
  }
}

class _AreaChartPainter extends CustomPainter {
  final List<MonthlyRevenue> data;
  final int maxValue;

  _AreaChartPainter({required this.data, required this.maxValue});

  @override
  void paint(Canvas canvas, Size size) {
    if (data.isEmpty || maxValue == 0) return;

    final w = size.width;
    final h = size.height - 20; // Leave space for labels
    final segW = w / (data.length - 1);

    // Grid lines
    final gridPaint = Paint()..color = AppColors.border..strokeWidth = 0.5;
    for (var i = 0; i < 4; i++) {
      final y = h * i / 3;
      canvas.drawLine(Offset(0, y), Offset(w, y), gridPaint);
    }

    // Build path
    final path = Path();
    final linePath = Path();
    final points = <Offset>[];

    for (var i = 0; i < data.length; i++) {
      final x = i * segW;
      final y = h - (data[i].revenuePaise / maxValue * h);
      points.add(Offset(x, y));
    }

    // Smooth curve
    linePath.moveTo(points[0].dx, points[0].dy);
    path.moveTo(points[0].dx, h);
    path.lineTo(points[0].dx, points[0].dy);

    for (var i = 1; i < points.length; i++) {
      final cp1x = points[i - 1].dx + segW * 0.4;
      final cp2x = points[i].dx - segW * 0.4;
      linePath.cubicTo(cp1x, points[i - 1].dy, cp2x, points[i].dy, points[i].dx, points[i].dy);
      path.cubicTo(cp1x, points[i - 1].dy, cp2x, points[i].dy, points[i].dx, points[i].dy);
    }

    path.lineTo(points.last.dx, h);
    path.close();

    // Fill gradient
    final fillPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0x40C026D3), Color(0x05C026D3)],
      ).createShader(Rect.fromLTWH(0, 0, w, h));
    canvas.drawPath(path, fillPaint);

    // Line
    final linePaint = Paint()
      ..color = AppColors.brand
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(linePath, linePaint);

    // Dots
    for (final p in points) {
      canvas.drawCircle(p, 3, Paint()..color = AppColors.brand);
      canvas.drawCircle(p, 2, Paint()..color = Colors.white);
    }

    // Month labels
    final labelStyle = TextStyle(fontSize: 10, color: AppColors.textMuted);
    for (var i = 0; i < data.length; i++) {
      final tp = TextPainter(
        text: TextSpan(text: data[i].month, style: labelStyle),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, Offset(i * segW - tp.width / 2, h + 6));
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ──────────────────────────────────────────────────────────────────────────────
// BOOKING BAR CHART
// ──────────────────────────────────────────────────────────────────────────────

class _BookingBarChart extends StatelessWidget {
  final List<MonthlyRevenue> data;
  const _BookingBarChart({required this.data});

  @override
  Widget build(BuildContext context) {
    final maxB = data.fold<int>(0, (m, d) => d.bookingCount > m ? d.bookingCount : m);

    return SizedBox(
      height: 120,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: data.map((d) {
          final h = maxB > 0 ? (d.bookingCount / maxB * 80) : 0.0;
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text('${d.bookingCount}', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.brand)),
                  const SizedBox(height: 4),
                  Container(
                    height: h,
                    decoration: BoxDecoration(
                      color: AppColors.brand.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: AppColors.brand.withOpacity(0.3)),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(d.month, style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PACKAGE DONUT
// ──────────────────────────────────────────────────────────────────────────────

class _PackageDonut extends StatelessWidget {
  final List<PackageBreakdown> packages;
  const _PackageDonut({required this.packages});

  static const _colors = [Color(0xFFC026D3), Color(0xFF3B82F6), Color(0xFF10B981), Color(0xFFF59E0B)];

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Donut chart
        SizedBox(
          width: 100,
          height: 100,
          child: CustomPaint(painter: _DonutPainter(packages: packages, colors: _colors)),
        ),
        const SizedBox(width: 20),
        // Legend
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: packages.asMap().entries.map((e) {
              final p = e.value;
              final c = _colors[e.key % _colors.length];
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Container(width: 10, height: 10, decoration: BoxDecoration(color: c, borderRadius: BorderRadius.circular(3))),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${p.name} · ${p.percentage.toStringAsFixed(0)}%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                          Text('${p.bookingCount} bookings', style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

class _DonutPainter extends CustomPainter {
  final List<PackageBreakdown> packages;
  final List<Color> colors;

  _DonutPainter({required this.packages, required this.colors});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 4;
    const strokeWidth = 16.0;

    var startAngle = -1.5708; // -π/2 (top)
    for (var i = 0; i < packages.length; i++) {
      final sweep = packages[i].percentage / 100 * 6.2832; // 2π
      final paint = Paint()
        ..color = colors[i % colors.length]
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius - strokeWidth / 2),
        startAngle,
        sweep - 0.05,
        false,
        paint,
      );
      startAngle += sweep;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ──────────────────────────────────────────────────────────────────────────────
// LEAD SOURCE BARS
// ──────────────────────────────────────────────────────────────────────────────

class _LeadSourceBars extends StatelessWidget {
  final List<LeadSource> sources;
  const _LeadSourceBars({required this.sources});

  static const _colors = [Color(0xFFC026D3), Color(0xFF3B82F6), Color(0xFF10B981), Color(0xFFF59E0B)];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: sources.asMap().entries.map((e) {
        final s = e.value;
        final c = _colors[e.key % _colors.length];
        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(s.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                  Text('${s.count} leads · ${s.percentage.toStringAsFixed(0)}%',
                      style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                ],
              ),
              const SizedBox(height: 4),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: s.percentage / 100,
                  backgroundColor: AppColors.surface,
                  valueColor: AlwaysStoppedAnimation(c),
                  minHeight: 6,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// RATING DISTRIBUTION
// ──────────────────────────────────────────────────────────────────────────────

class _RatingDistribution extends StatelessWidget {
  final Map<int, int> distribution;
  final int total;
  final double avg;

  const _RatingDistribution({required this.distribution, required this.total, required this.avg});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Big rating
        Column(
          children: [
            Text(avg.toStringAsFixed(1), style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w800, color: AppColors.brand)),
            Row(
              children: List.generate(5, (i) => Icon(
                i < avg.floor() ? Icons.star : (i < avg.ceil() ? Icons.star_half : Icons.star_border),
                color: const Color(0xFFF59E0B),
                size: 14,
              )),
            ),
            const SizedBox(height: 4),
            Text('$total reviews', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
          ],
        ),
        const SizedBox(width: 20),
        // Bars
        Expanded(
          child: Column(
            children: [5, 4, 3, 2, 1].map((star) {
              final count = distribution[star] ?? 0;
              final frac = total > 0 ? count / total : 0.0;
              return Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  children: [
                    Text('$star', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                    const SizedBox(width: 4),
                    const Icon(Icons.star, size: 10, color: Color(0xFFF59E0B)),
                    const SizedBox(width: 6),
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(3),
                        child: LinearProgressIndicator(
                          value: frac,
                          backgroundColor: AppColors.surface,
                          valueColor: const AlwaysStoppedAnimation(Color(0xFFF59E0B)),
                          minHeight: 6,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(width: 24, child: Text('$count', style: const TextStyle(fontSize: 11, color: AppColors.textMuted), textAlign: TextAlign.right)),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// RESPONSE METRICS
// ──────────────────────────────────────────────────────────────────────────────

class _ResponseMetrics extends StatelessWidget {
  final PerformanceMetrics perf;
  const _ResponseMetrics({required this.perf});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: _ResponseGauge(
          label: 'Response Rate',
          value: perf.responseRate / 100,
          text: '${perf.responseRate.toStringAsFixed(0)}%',
          color: const Color(0xFF10B981),
        )),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _ResponseStat(label: 'Avg Reply Time', value: '${perf.avgResponseMinutes} min', icon: Icons.schedule, color: const Color(0xFF3B82F6)),
              const SizedBox(height: 12),
              _ResponseStat(label: 'Repeat Clients', value: '${perf.repeatCustomers}', icon: Icons.repeat, color: const Color(0xFF8B5CF6)),
            ],
          ),
        ),
      ],
    );
  }
}

class _ResponseGauge extends StatelessWidget {
  final String label, text;
  final double value;
  final Color color;

  const _ResponseGauge({required this.label, required this.value, required this.text, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: 80, height: 80,
          child: Stack(
            fit: StackFit.expand,
            children: [
              CircularProgressIndicator(
                value: value,
                strokeWidth: 8,
                backgroundColor: AppColors.surface,
                valueColor: AlwaysStoppedAnimation(color),
              ),
              Center(child: Text(text, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: color))),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
      ],
    );
  }
}

class _ResponseStat extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;

  const _ResponseStat({required this.label, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: color)),
              Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
            ],
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
String _formatCurrency(int paise) {
  final rupees = paise ~/ 100;
  if (rupees >= 10000000) return '₹${(rupees / 10000000).toStringAsFixed(1)}Cr';
  if (rupees >= 100000) return '₹${(rupees / 100000).toStringAsFixed(1)}L';
  if (rupees >= 1000) return '₹${(rupees / 1000).toStringAsFixed(1)}K';
  return '₹$rupees';
}
