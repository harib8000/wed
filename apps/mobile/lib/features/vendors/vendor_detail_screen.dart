import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme.dart';
import '../../models/vendor.dart';
import '../../models/review.dart';
import '../../providers/vendor_provider.dart';

// ─── Vendor Detail Screen ───────────────────────────────────
class VendorDetailScreen extends ConsumerWidget {
  final String vendorId;
  const VendorDetailScreen({super.key, required this.vendorId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vendorAsync = ref.watch(vendorDetailProvider(vendorId));

    return vendorAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(),
        body: const Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            const Icon(Icons.error_outline, size: 48, color: AppColors.textMuted),
            const SizedBox(height: 12),
            const Text('Could not load vendor'),
            TextButton(
              onPressed: () => ref.refresh(vendorDetailProvider(vendorId)),
              child: const Text('Retry'),
            ),
          ]),
        ),
      ),
      data: (vendor) => _VendorDetailView(vendor: vendor, ref: ref),
    );
  }
}

class _VendorDetailView extends StatefulWidget {
  final Vendor vendor;
  final WidgetRef ref;
  const _VendorDetailView({required this.vendor, required this.ref});

  @override
  State<_VendorDetailView> createState() => _VendorDetailViewState();
}

class _VendorDetailViewState extends State<_VendorDetailView> {
  int _selectedPackageIndex = 0;

  void _openGallery(BuildContext context, List<PortfolioItem> items, int initialIndex) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => _FullScreenGallery(items: items, initialIndex: initialIndex),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final vendor = widget.vendor;
    final reviewsAsync = widget.ref.watch(vendorReviewsProvider(vendor.id));
    final wishlist = widget.ref.watch(wishlistProvider);
    final isWishlisted = wishlist.any((w) => w.vendorId == vendor.id);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // ─── Hero App Bar ───────────────
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(imageUrl: vendor.displayImage, fit: BoxFit.cover),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter, end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Colors.black.withOpacity(0.7)],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 20, left: 16, right: 16,
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      if (vendor.verified)
                        Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(color: AppColors.brand, borderRadius: BorderRadius.circular(8)),
                          child: const Row(mainAxisSize: MainAxisSize.min, children: [
                            Icon(Icons.verified, color: Colors.white, size: 12),
                            SizedBox(width: 4),
                            Text('Verified Vendor', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600)),
                          ]),
                        ),
                      Text(vendor.businessName,
                          style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Row(children: [
                        Icon(Icons.location_on, color: Colors.white.withOpacity(0.8), size: 14),
                        const SizedBox(width: 4),
                        Text('${vendor.city} · ${vendor.category}',
                            style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 13)),
                      ]),
                    ]),
                  ),
                ],
              ),
            ),
            actions: [
              IconButton(
                icon: Icon(isWishlisted ? Icons.favorite : Icons.favorite_border, color: Colors.white),
                onPressed: () => widget.ref.read(wishlistProvider.notifier).toggle(vendor),
              ),
              IconButton(icon: const Icon(Icons.share, color: Colors.white), onPressed: () {}),
            ],
          ),

          // ─── Stats Row ──────────────────
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
              child: Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
                _StatItem(icon: Icons.star, value: vendor.avgRating.toStringAsFixed(1), label: 'Rating', color: AppColors.gold),
                Container(width: 1, height: 40, color: AppColors.border),
                _StatItem(icon: Icons.rate_review, value: '${vendor.reviewCount}', label: 'Reviews', color: AppColors.brand),
                Container(width: 1, height: 40, color: AppColors.border),
                _StatItem(icon: Icons.event_available, value: '${vendor.bookingCount}+', label: 'Bookings', color: Colors.green),
              ]),
            ),
          ),

          // ─── Description ─────────────────
          if (vendor.description != null)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('About', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  const SizedBox(height: 8),
                  Text(vendor.description!, style: const TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.5)),
                ]),
              ),
            ),

          // ─── Tagline & USPs ──────────────
          if (vendor.tagline != null)
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.brandLight,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.brand.withOpacity(0.2)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.format_quote, color: AppColors.brand, size: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        vendor.tagline!,
                        style: const TextStyle(fontStyle: FontStyle.italic, fontSize: 14, color: AppColors.brand, fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // ─── Trust Badges / Social Proof ──
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  if (vendor.verified) _TrustBadge(icon: Icons.verified_user, label: 'KYC Verified', color: Colors.green),
                  _TrustBadge(icon: Icons.shield_outlined, label: 'Escrow Safe', color: Colors.blue),
                  _TrustBadge(icon: Icons.schedule, label: 'On-Time', color: Colors.orange),
                  _TrustBadge(icon: Icons.thumb_up_outlined, label: '${vendor.avgRating >= 4.5 ? "Top Rated" : "Reliable"}', color: AppColors.gold),
                ],
              ),
            ),
          ),

          // ─── Portfolio ───────────────────
          if (vendor.portfolio.isNotEmpty) ...[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Portfolio', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    Text('${vendor.portfolio.length} items',
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 180,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: vendor.portfolio.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (ctx, i) => GestureDetector(
                    onTap: () => _openGallery(ctx, vendor.portfolio, i),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Stack(
                        children: [
                          CachedNetworkImage(
                            imageUrl: vendor.portfolio[i].mediaUrl,
                            width: 160, height: 180, fit: BoxFit.cover,
                          ),
                          Positioned(
                            bottom: 0, left: 0, right: 0,
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.bottomCenter,
                                  end: Alignment.topCenter,
                                  colors: [Colors.black.withOpacity(0.6), Colors.transparent],
                                ),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.zoom_in, color: Colors.white, size: 14),
                                  const SizedBox(width: 4),
                                  Text('${i + 1}/${vendor.portfolio.length}',
                                      style: const TextStyle(color: Colors.white, fontSize: 11)),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],

          // ─── Packages ────────────────────
          if (vendor.packages.isNotEmpty) ...[
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(16, 24, 16, 12),
                child: Text('Packages', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, i) => _PackageCard(
                    package: vendor.packages[i],
                    index: i,
                    selected: _selectedPackageIndex == i,
                    onSelect: () => setState(() => _selectedPackageIndex = i),
                  ),
                  childCount: vendor.packages.length,
                ),
              ),
            ),
          ],

          // ─── Reviews ─────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
              child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                const Text('Reviews', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                reviewsAsync.maybeWhen(
                  data: (reviews) => Text('${reviews.length} total',
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
                  orElse: () => const SizedBox.shrink(),
                ),
              ]),
            ),
          ),
          reviewsAsync.when(
            loading: () => const SliverToBoxAdapter(
                child: Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()))),
            error: (_, __) => const SliverToBoxAdapter(
                child: Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: Text('Could not load reviews'))),
            data: (reviews) => reviews.isEmpty
                ? const SliverToBoxAdapter(
                    child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: Text('No reviews yet', style: TextStyle(color: AppColors.textMuted)),
                  ))
                : SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, i) => _ReviewCard(review: reviews[i]),
                        childCount: reviews.length,
                      ),
                    ),
                  ),
          ),
        ],
      ),

      // ─── Bottom CTA ──────────────────
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, -4))],
          ),
          child: Row(children: [
            Expanded(
              child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Starting from', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                if (vendor.startingPricePaise != null)
                  Text(
                    '₹${(vendor.startingPricePaise! / 100).toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d)(?=(\d{2})+\d$)'), (m) => '${m[1]},')}',
                    style: const TextStyle(color: AppColors.brand, fontWeight: FontWeight.bold, fontSize: 20),
                  ),
              ]),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: ElevatedButton(
                onPressed: () => context.push('/checkout/${vendor.id}'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brand, foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Send Enquiry', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}

// ─── Stat Item ──────────────────────────────────────────────
class _StatItem extends StatelessWidget {
  final IconData icon;
  final String value, label;
  final Color color;
  const _StatItem({required this.icon, required this.value, required this.label, required this.color});

  @override
  Widget build(BuildContext context) => Column(children: [
    Icon(icon, color: color, size: 20),
    const SizedBox(height: 4),
    Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
    Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
  ]);
}

// ─── Package Card ────────────────────────────────────────────
class _PackageCard extends StatelessWidget {
  final VendorPackage package;
  final int index;
  final bool selected;
  final VoidCallback onSelect;
  const _PackageCard({required this.package, required this.index, required this.selected, required this.onSelect});

  static const _colors = [Color(0xFFEDE9FE), Color(0xFFFEF3C7), Color(0xFFFCE7F3)];
  static const _borderColors = [Color(0xFFC084FC), Color(0xFFFBBF24), Color(0xFFF472B6)];

  @override
  Widget build(BuildContext context) {
    final bgColor = selected ? AppColors.brandLight : _colors[index % _colors.length];
    final borderColor = selected ? AppColors.brand : _borderColors[index % _borderColors.length];
    final price = package.priceFromPaise ~/ 100;
    final priceStr = '₹${price.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{2})+\d$)'), (m) => '${m[1]},')}';

    return GestureDetector(
      onTap: onSelect,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor, width: selected ? 2 : 1.5),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Row(children: [
              Container(
                width: 20, height: 20,
                decoration: BoxDecoration(
                  color: selected ? AppColors.brand : Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(color: selected ? AppColors.brand : borderColor, width: 2),
                ),
                child: selected ? const Icon(Icons.check, color: Colors.white, size: 12) : null,
              ),
              const SizedBox(width: 8),
              Text(package.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: Colors.white.withOpacity(0.7), borderRadius: BorderRadius.circular(6)),
                child: Text(package.packageType, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: borderColor)),
              ),
            ]),
            Text(priceStr, style: TextStyle(color: selected ? AppColors.brand : Colors.grey.shade700, fontWeight: FontWeight.bold, fontSize: 16)),
          ]),
          if (package.description != null) ...[
            const SizedBox(height: 4),
            Text(package.description!, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
          ],
          if (package.inclusions.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8, runSpacing: 6,
              children: package.inclusions.map((item) => Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.check_circle, color: Colors.green, size: 14),
                  const SizedBox(width: 4),
                  Text(item, style: const TextStyle(fontSize: 12)),
                ],
              )).toList(),
            ),
          ],
        ]),
      ),
    );
  }
}

// ─── Review Card ─────────────────────────────────────────────
class _ReviewCard extends StatelessWidget {
  final Review review;
  const _ReviewCard({required this.review});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Row(children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: AppColors.brandLight,
              child: Text(
                (review.customerName ?? 'U')[0].toUpperCase(),
                style: const TextStyle(color: AppColors.brand, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(width: 10),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(review.customerName ?? 'Anonymous',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
              Text(
                '${review.createdAt.day}/${review.createdAt.month}/${review.createdAt.year}',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
              ),
            ]),
          ]),
          Row(children: [
            const Icon(Icons.star, color: AppColors.gold, size: 14),
            const SizedBox(width: 2),
            Text(review.rating.toStringAsFixed(1),
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
          ]),
        ]),
        const SizedBox(height: 10),
        if (review.title != null) ...[
          Text(review.title!, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(height: 4),
        ],
        Text(review.body,
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4)),
      ]),
    );
  }
}

// ─── Trust Badge ─────────────────────────────────────────────
class _TrustBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const _TrustBadge({required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: color)),
      ],
    );
  }
}

// ─── Full Screen Gallery ─────────────────────────────────────
class _FullScreenGallery extends StatefulWidget {
  final List<PortfolioItem> items;
  final int initialIndex;
  const _FullScreenGallery({required this.items, required this.initialIndex});

  @override
  State<_FullScreenGallery> createState() => _FullScreenGalleryState();
}

class _FullScreenGalleryState extends State<_FullScreenGallery> {
  late PageController _controller;
  late int _current;

  @override
  void initState() {
    super.initState();
    _current = widget.initialIndex;
    _controller = PageController(initialPage: _current);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: Text('${_current + 1} / ${widget.items.length}',
            style: const TextStyle(fontSize: 14)),
        centerTitle: true,
      ),
      body: PageView.builder(
        controller: _controller,
        itemCount: widget.items.length,
        onPageChanged: (i) => setState(() => _current = i),
        itemBuilder: (_, i) => InteractiveViewer(
          child: Center(
            child: CachedNetworkImage(
              imageUrl: widget.items[i].mediaUrl,
              fit: BoxFit.contain,
              placeholder: (_, __) => const Center(child: CircularProgressIndicator(color: Colors.white)),
              errorWidget: (_, __, ___) => const Icon(Icons.broken_image, color: Colors.white54, size: 48),
            ),
          ),
        ),
      ),
    );
  }
}
