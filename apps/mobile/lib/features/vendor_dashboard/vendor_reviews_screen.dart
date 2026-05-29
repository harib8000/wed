import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';
import '../../models/vendor_analytics.dart';
import '../../providers/vendor_analytics_provider.dart';
import '../../shared/widgets/error_state_widget.dart';
import '../../shared/widgets/shimmer_state_widget.dart';

class VendorReviewsScreen extends ConsumerWidget {
  const VendorReviewsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final analyticsAsync = ref.watch(vendorAnalyticsProvider);
    final reviewsAsync = ref.watch(vendorReviewsListProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Reviews & Ratings'),
        automaticallyImplyLeading: false,
      ),
      body: reviewsAsync.when(
        loading: () => const ShimmerStateWidget(itemCount: 4, itemHeight: 132),
        error: (e, _) => ErrorStateWidget(
          message: 'Reviews could not load at the moment.',
          onRetry: () => ref.refresh(vendorReviewsListProvider.future),
        ),
        data: (reviews) {
          final perf = analyticsAsync.valueOrNull?.performance;
          return _ReviewsBody(reviews: reviews, perf: perf);
        },
      ),
    );
  }
}

class _ReviewsBody extends StatefulWidget {
  final List<VendorReviewItem> reviews;
  final PerformanceMetrics? perf;
  const _ReviewsBody({required this.reviews, required this.perf});

  @override
  State<_ReviewsBody> createState() => _ReviewsBodyState();
}

class _ReviewsBodyState extends State<_ReviewsBody> {
  int? _filterRating;

  @override
  Widget build(BuildContext context) {
    final filtered = _filterRating == null
        ? widget.reviews
        : widget.reviews.where((r) => r.rating.floor() == _filterRating).toList();

    return CustomScrollView(
      slivers: [
        // Rating Overview
        if (widget.perf != null)
          SliverToBoxAdapter(child: _RatingOverview(perf: widget.perf!)),

        // Filter chips
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                _FilterChip(label: 'All', active: _filterRating == null, onTap: () => setState(() => _filterRating = null)),
                ...[5, 4, 3, 2, 1].map((s) => _FilterChip(
                  label: '$s★',
                  active: _filterRating == s,
                  onTap: () => setState(() => _filterRating = _filterRating == s ? null : s),
                )),
              ],
            ),
          ),
        ),

        // Response rate banner
        SliverToBoxAdapter(
          child: Container(
            margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withOpacity(0.05),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF10B981).withOpacity(0.2)),
            ),
            child: Row(
              children: [
                const Icon(Icons.reply, size: 16, color: Color(0xFF10B981)),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text('You\'ve replied to 67% of reviews. Aim for 100%!',
                      style: TextStyle(fontSize: 12, color: Color(0xFF10B981))),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: const Color(0xFF10B981), borderRadius: BorderRadius.circular(6)),
                  child: const Text('Reply All', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
        ),

        // Reviews list
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
          sliver: filtered.isEmpty
              ? const SliverToBoxAdapter(
                  child: Center(
                    child: Padding(
                      padding: EdgeInsets.all(40),
                      child: Text('No reviews with this rating', style: TextStyle(color: AppColors.textMuted)),
                    ),
                  ),
                )
              : SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (_, i) => _ReviewCard(review: filtered[i]),
                    childCount: filtered.length,
                  ),
                ),
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// RATING OVERVIEW
// ──────────────────────────────────────────────────────────────────────────────

class _RatingOverview extends StatelessWidget {
  final PerformanceMetrics perf;
  const _RatingOverview({required this.perf});

  @override
  Widget build(BuildContext context) {
    final dist = perf.ratingDistribution;
    final total = perf.totalReviews;

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          // Big rating
          Column(
            children: [
              Text(perf.avgRating.toStringAsFixed(1),
                  style: const TextStyle(fontSize: 40, fontWeight: FontWeight.w800, color: AppColors.brand)),
              Row(
                children: List.generate(5, (i) {
                  if (i < perf.avgRating.floor()) return const Icon(Icons.star, color: Color(0xFFF59E0B), size: 16);
                  if (i < perf.avgRating.ceil()) return const Icon(Icons.star_half, color: Color(0xFFF59E0B), size: 16);
                  return const Icon(Icons.star_border, color: Color(0xFFF59E0B), size: 16);
                }),
              ),
              const SizedBox(height: 4),
              Text('$total reviews', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
            ],
          ),
          const SizedBox(width: 24),
          // Distribution bars
          Expanded(
            child: Column(
              children: [5, 4, 3, 2, 1].map((star) {
                final count = dist[star] ?? 0;
                final frac = total > 0 ? count / total : 0.0;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 3),
                  child: Row(
                    children: [
                      SizedBox(width: 14, child: Text('$star', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600))),
                      const Icon(Icons.star, size: 10, color: Color(0xFFF59E0B)),
                      const SizedBox(width: 6),
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(3),
                          child: LinearProgressIndicator(
                            value: frac,
                            backgroundColor: AppColors.surface,
                            valueColor: AlwaysStoppedAnimation(star >= 4 ? const Color(0xFF10B981) : star == 3 ? const Color(0xFFF59E0B) : const Color(0xFFEF4444)),
                            minHeight: 8,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(width: 20, child: Text('$count', style: const TextStyle(fontSize: 11, color: AppColors.textMuted))),
                    ],
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
// FILTER CHIP
// ──────────────────────────────────────────────────────────────────────────────

class _FilterChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _FilterChip({required this.label, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 6),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: active ? AppColors.brand : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: active ? AppColors.brand : AppColors.border),
        ),
        child: Text(label, style: TextStyle(
          fontSize: 12,
          fontWeight: active ? FontWeight.w600 : FontWeight.normal,
          color: active ? Colors.white : AppColors.textSecondary,
        )),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// REVIEW CARD
// ──────────────────────────────────────────────────────────────────────────────

class _ReviewCard extends StatelessWidget {
  final VendorReviewItem review;
  const _ReviewCard({required this.review});

  Future<void> _showReplySheet(BuildContext context) async {
    final replyController = TextEditingController();
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(sheetContext).viewInsets.bottom + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 48,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text('Reply to ${review.customerName}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            TextField(
              controller: replyController,
              maxLines: 4,
              decoration: const InputDecoration(
                hintText: 'Thank the customer and address their feedback',
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(sheetContext).pop();
                  ScaffoldMessenger.of(context)
                    ..hideCurrentSnackBar()
                    ..showSnackBar(const SnackBar(content: Text('Reply submitted!')));
                },
                child: const Text('Submit Reply'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dateStr = '${review.date.day}/${review.date.month}/${review.date.year}';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 8),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: AppColors.brand.withOpacity(0.1),
                  child: Text(review.customerName[0],
                      style: TextStyle(color: AppColors.brand, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(review.customerName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                      Text('${review.eventType} · $dateStr', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                    ],
                  ),
                ),
                // Stars
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: review.rating >= 4 ? const Color(0xFF10B981).withOpacity(0.1) : const Color(0xFFF59E0B).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.star, size: 12, color: review.rating >= 4 ? const Color(0xFF10B981) : const Color(0xFFF59E0B)),
                      const SizedBox(width: 2),
                      Text(review.rating.toStringAsFixed(1),
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: review.rating >= 4 ? const Color(0xFF10B981) : const Color(0xFFF59E0B))),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Sub-ratings
          if (review.qualityRating != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 8),
              child: Row(
                children: [
                  _SubRating(label: 'Quality', value: review.qualityRating!),
                  const SizedBox(width: 12),
                  _SubRating(label: 'Value', value: review.valueRating ?? 0),
                  const SizedBox(width: 12),
                  _SubRating(label: 'Professional', value: review.professionalismRating ?? 0),
                ],
              ),
            ),

          // Body
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 10),
            child: Text(review.body, style: const TextStyle(fontSize: 13, height: 1.4, color: AppColors.textSecondary)),
          ),

          // Photos
          if (review.photoUrls.isNotEmpty)
            SizedBox(
              height: 60,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.fromLTRB(14, 0, 14, 10),
                itemCount: review.photoUrls.length,
                separatorBuilder: (_, __) => const SizedBox(width: 6),
                itemBuilder: (_, i) => ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(review.photoUrls[i], width: 60, height: 60, fit: BoxFit.cover),
                ),
              ),
            ),

          // Vendor reply
          if (review.vendorReply != null)
            Container(
              margin: const EdgeInsets.fromLTRB(14, 0, 14, 12),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.reply, size: 12, color: AppColors.brand),
                      const SizedBox(width: 4),
                      Text('Your Reply', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.brand)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(review.vendorReply!, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                ],
              ),
            ),

          // Reply button
          if (review.vendorReply == null)
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
              child: GestureDetector(
                onTap: () => _showReplySheet(context),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.brand.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.brand.withOpacity(0.2)),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.reply, size: 14, color: AppColors.brand),
                      SizedBox(width: 4),
                      Text('Write a Reply', style: TextStyle(fontSize: 12, color: AppColors.brand, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _SubRating extends StatelessWidget {
  final String label;
  final double value;
  const _SubRating({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('$label ', style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
        ...List.generate(5, (i) => Icon(
          i < value.floor() ? Icons.circle : Icons.circle_outlined,
          size: 6,
          color: i < value.floor() ? const Color(0xFFF59E0B) : AppColors.border,
        )),
      ],
    );
  }
}
