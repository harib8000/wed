import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../../core/theme.dart';
import '../../models/review.dart';
import '../../models/vendor.dart';
import '../../providers/vendor_provider.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/error_state_widget.dart';

class VendorDetailScreen extends ConsumerWidget {
  final String vendorId;
  const VendorDetailScreen({super.key, required this.vendorId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vendorAsync = ref.watch(vendorDetailProvider(vendorId));

    return vendorAsync.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (_, __) => Scaffold(
        appBar: AppBar(),
        body: ErrorStateWidget(
          message: 'Could not load vendor details.',
          onRetry: () => ref.refresh(vendorDetailProvider(vendorId)),
        ),
      ),
      data: (vendor) => _VendorDetailView(vendor: vendor),
    );
  }
}

class _VendorDetailView extends ConsumerStatefulWidget {
  final Vendor vendor;
  const _VendorDetailView({required this.vendor});

  @override
  ConsumerState<_VendorDetailView> createState() => _VendorDetailViewState();
}

class _VendorDetailViewState extends ConsumerState<_VendorDetailView> {
  static const _recentlyViewedBoxName = 'recently_viewed_vendors';
  static const _availabilitySlots = [
    ('Today', 'Evening'),
    ('Tomorrow', 'Few slots'),
    ('This Week', 'Fast filling'),
    ('Next Month', 'Available'),
  ];

  int _selectedPackageIndex = 0;
  late final PageController _heroController;
  int _heroPage = 0;

  @override
  void initState() {
    super.initState();
    _heroController = PageController();
    WidgetsBinding.instance.addPostFrameCallback((_) => _saveRecentlyViewed());
  }

  @override
  void dispose() {
    _heroController.dispose();
    super.dispose();
  }

  Future<void> _saveRecentlyViewed() async {
    final vendor = widget.vendor;
    final box = await Hive.openBox<Map<dynamic, dynamic>>(_recentlyViewedBoxName);
    await box.put(vendor.id, {
      'id': vendor.id,
      'name': vendor.businessName,
      'city': vendor.city,
      'imageUrl': vendor.displayImage,
      'viewedAt': DateTime.now().toIso8601String(),
    });
  }

  void _openGallery(List<PortfolioItem> items, int initialIndex) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => _FullScreenGallery(items: items, initialIndex: initialIndex),
    ));
  }

  String _formatPrice(int? paise) {
    if (paise == null) return 'Custom quote';
    final rupees = paise ~/ 100;
    if (rupees >= 100000) return '₹${(rupees / 100000).toStringAsFixed(1)}L';
    if (rupees >= 1000) return '₹${(rupees / 1000).toStringAsFixed(0)}K';
    return '₹$rupees';
  }

  @override
  Widget build(BuildContext context) {
    final vendor = widget.vendor;
    final reviewsAsync = ref.watch(vendorReviewsProvider(vendor.id));
    final vendorsAsync = ref.watch(vendorSearchProvider);
    final isWishlisted = ref.watch(wishlistProvider.select((items) => items.any((item) => item.vendorId == vendor.id)));
    final galleryItems = vendor.portfolio.isNotEmpty ? vendor.portfolio : [PortfolioItem(id: '${vendor.id}-hero', mediaUrl: vendor.displayImage)];
    final similarVendors = vendorsAsync.valueOrNull
            ?.where((item) => item.id != vendor.id && item.category == vendor.category)
            .take(6)
            .toList() ??
        const <Vendor>[];

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 320,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  PageView.builder(
                    controller: _heroController,
                    itemCount: galleryItems.length,
                    onPageChanged: (value) => setState(() => _heroPage = value),
                    itemBuilder: (context, index) => GestureDetector(
                      onTap: () => _openGallery(galleryItems, index),
                      child: CachedNetworkImage(imageUrl: galleryItems[index].mediaUrl, fit: BoxFit.cover),
                    ),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.black.withOpacity(0.12), Colors.black.withOpacity(0.72)],
                      ),
                    ),
                  ),
                  Positioned(
                    left: 16,
                    right: 16,
                    bottom: 20,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            if (vendor.verified)
                              const _HeroBadge(label: 'Verified Vendor', icon: Icons.verified),
                            if (vendor.plusMember)
                              const _HeroBadge(label: 'Plus Member', icon: Icons.workspace_premium_outlined),
                            _HeroBadge(label: '${_heroPage + 1}/${galleryItems.length}', icon: Icons.photo_library_outlined),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(vendor.businessName, style: const TextStyle(color: Colors.white, fontSize: 25, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Icon(Icons.location_on, color: Colors.white.withOpacity(0.82), size: 15),
                            const SizedBox(width: 4),
                            Expanded(child: Text('${vendor.city}, ${vendor.state}', style: TextStyle(color: Colors.white.withOpacity(0.82), fontSize: 13))),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 6,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        galleryItems.length,
                        (index) => AnimatedContainer(
                          duration: const Duration(milliseconds: 220),
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          width: _heroPage == index ? 18 : 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: _heroPage == index ? Colors.white : Colors.white54,
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              IconButton(
                icon: Icon(isWishlisted ? Icons.favorite : Icons.favorite_border, color: Colors.white),
                onPressed: () async {
                  HapticFeedback.lightImpact();
                  await ref.read(wishlistProvider.notifier).toggle(vendor);
                },
              ),
              IconButton(
                icon: const Icon(Icons.share_outlined, color: Colors.white),
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: 'https://weddingos.in/vendors/${vendor.id}'));
                  if (!mounted) return;
                  ScaffoldMessenger.of(context)
                    ..hideCurrentSnackBar()
                    ..showSnackBar(const SnackBar(content: Text('Vendor profile link copied.')));
                },
              ),
            ],
          ),
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _StatItem(icon: Icons.star, value: vendor.avgRating.toStringAsFixed(1), label: 'Rating', color: AppColors.gold),
                  Container(width: 1, height: 40, color: AppColors.border),
                  _StatItem(icon: Icons.rate_review, value: '${vendor.reviewCount}', label: 'Reviews', color: AppColors.brand),
                  Container(width: 1, height: 40, color: AppColors.border),
                  _StatItem(icon: Icons.event_available, value: '${vendor.bookingCount}+', label: 'Bookings', color: Colors.green),
                ],
              ),
            ),
          ),
          if (vendor.tagline != null)
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.fromLTRB(16, 0, 16, 0),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: AppColors.brandLight, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.brand.withOpacity(0.2))),
                child: Row(
                  children: [
                    const Icon(Icons.auto_awesome_rounded, color: AppColors.brand),
                    const SizedBox(width: 10),
                    Expanded(child: Text(vendor.tagline!, style: const TextStyle(color: AppColors.brand, fontWeight: FontWeight.w600))),
                  ],
                ),
              ),
            ),
          if (vendor.description != null)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 18, 16, 0),
                child: _InfoCard(
                  title: 'About',
                  child: Text(vendor.description!, style: const TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.5)),
                ),
              ),
            ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 0),
              child: _InfoCard(
                title: 'Availability',
                child: Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: _availabilitySlots
                      .map(
                        (slot) => Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(slot.$1, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                              const SizedBox(height: 2),
                              Text(slot.$2, style: TextStyle(color: slot.$2 == 'Available' ? Colors.green.shade700 : AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ),
                      )
                      .toList(),
                ),
              ),
            ),
          ),
          if (vendor.portfolio.isNotEmpty) ...[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Portfolio', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    Text('${vendor.portfolio.length} items', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
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
                    onTap: () => _openGallery(vendor.portfolio, i),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Stack(
                        children: [
                          CachedNetworkImage(imageUrl: vendor.portfolio[i].mediaUrl, width: 160, height: 180, fit: BoxFit.cover),
                          Positioned(
                            bottom: 0,
                            left: 0,
                            right: 0,
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(begin: Alignment.bottomCenter, end: Alignment.topCenter, colors: [Colors.black.withOpacity(0.6), Colors.transparent]),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.zoom_in, color: Colors.white, size: 14),
                                  const SizedBox(width: 4),
                                  Text('${i + 1}/${vendor.portfolio.length}', style: const TextStyle(color: Colors.white, fontSize: 11)),
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
                  (context, index) => _PackageCard(
                    package: vendor.packages[index],
                    index: index,
                    selected: _selectedPackageIndex == index,
                    onSelect: () => setState(() => _selectedPackageIndex = index),
                  ),
                  childCount: vendor.packages.length,
                ),
              ),
            ),
          ],
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Reviews', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  reviewsAsync.maybeWhen(
                    data: (reviews) => Text('${reviews.length} total', style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
                    orElse: () => const SizedBox.shrink(),
                  ),
                ],
              ),
            ),
          ),
          reviewsAsync.when(
            loading: () => const SliverToBoxAdapter(child: Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator()))),
            error: (_, __) => const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: ErrorStateWidget(message: 'Could not load reviews.'),
              ),
            ),
            data: (reviews) => reviews.isEmpty
                ? const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.symmetric(horizontal: 16),
                      child: EmptyStateWidget(icon: Icons.rate_review_outlined, title: 'No reviews yet', message: 'Be the first couple to leave feedback for this vendor.'),
                    ),
                  )
                : SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _ReviewCard(review: reviews[index]),
                        ),
                        childCount: reviews.take(3).length,
                      ),
                    ),
                  ),
          ),
          if (similarVendors.isNotEmpty) ...[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Similar vendors', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    TextButton(onPressed: () => context.push('/vendors?category=${vendor.category}'), child: const Text('See all')),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 210,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: similarVendors.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, index) => _SimilarVendorCard(vendor: similarVendors[index]),
                ),
              ),
            ),
          ],
          const SliverToBoxAdapter(child: SizedBox(height: 120)),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.white, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, -4))]),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Starting from', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                    Text(_formatPrice(vendor.startingPricePaise), style: const TextStyle(color: AppColors.brand, fontWeight: FontWeight.bold, fontSize: 20)),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => context.push('/chat/${vendor.id}'),
                  icon: const Icon(Icons.chat_bubble_outline),
                  label: const Text('Chat'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => context.push('/checkout/${vendor.id}'),
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.brand, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  child: const Text('Book Now', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeroBadge extends StatelessWidget {
  final String label;
  final IconData icon;
  const _HeroBadge({required this.label, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.16), borderRadius: BorderRadius.circular(18)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.white),
          const SizedBox(width: 5),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final String title;
  final Widget child;
  const _InfoCard({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color color;
  const _StatItem({required this.icon, required this.value, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
      ],
    );
  }
}

class _PackageCard extends StatelessWidget {
  final VendorPackage package;
  final int index;
  final bool selected;
  final VoidCallback onSelect;
  const _PackageCard({required this.package, required this.index, required this.selected, required this.onSelect});

  static const _colors = [Color(0xFFEDE9FE), Color(0xFFFEF3C7), Color(0xFFFCE7F3)];
  static const _borderColors = [Color(0xFFC084FC), Color(0xFFFBBF24), Color(0xFFF472B6)];

  String _format(int paise) {
    final rupees = paise ~/ 100;
    if (rupees >= 100000) return '₹${(rupees / 100000).toStringAsFixed(1)}L';
    if (rupees >= 1000) return '₹${(rupees / 1000).toStringAsFixed(0)}K';
    return '₹$rupees';
  }

  @override
  Widget build(BuildContext context) {
    final bgColor = selected ? AppColors.brandLight : _colors[index % _colors.length];
    final borderColor = selected ? AppColors.brand : _borderColors[index % _borderColors.length];

    return GestureDetector(
      onTap: onSelect,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(16), border: Border.all(color: borderColor, width: selected ? 2 : 1.5)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(color: selected ? AppColors.brand : Colors.white, shape: BoxShape.circle, border: Border.all(color: selected ? AppColors.brand : borderColor, width: 2)),
                        child: selected ? const Icon(Icons.check, color: Colors.white, size: 12) : null,
                      ),
                      const SizedBox(width: 8),
                      Expanded(child: Text(package.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
                    ],
                  ),
                ),
                Text(_format(package.priceFromPaise), style: TextStyle(color: selected ? AppColors.brand : Colors.grey.shade700, fontWeight: FontWeight.bold, fontSize: 16)),
              ],
            ),
            if (package.description != null) ...[
              const SizedBox(height: 6),
              Text(package.description!, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
            ],
            if (package.inclusions.isNotEmpty) ...[
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: package.inclusions.take(6).map((item) => Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.check_circle, color: Colors.green, size: 14),
                    const SizedBox(width: 4),
                    Text(item, style: const TextStyle(fontSize: 12)),
                  ],
                )).toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  final Review review;
  const _ReviewCard({required this.review});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: AppColors.brandLight,
                    child: Text((review.customerName ?? 'U')[0].toUpperCase(), style: const TextStyle(color: AppColors.brand, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(review.customerName ?? 'Anonymous', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                      Text('${review.createdAt.day}/${review.createdAt.month}/${review.createdAt.year}', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                    ],
                  ),
                ],
              ),
              Row(
                children: [
                  const Icon(Icons.star, color: AppColors.gold, size: 14),
                  const SizedBox(width: 2),
                  Text(review.rating.toStringAsFixed(1), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (review.title != null) ...[
            Text(review.title!, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 4),
          ],
          Text(review.body, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4)),
        ],
      ),
    );
  }
}

class _SimilarVendorCard extends StatelessWidget {
  final Vendor vendor;
  const _SimilarVendorCard({required this.vendor});

  String _price(int? paise) {
    if (paise == null) return 'Custom quote';
    final rupees = paise ~/ 100;
    return rupees >= 100000 ? '₹${(rupees / 100000).toStringAsFixed(1)}L' : '₹${(rupees / 1000).toStringAsFixed(0)}K';
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/vendors/${vendor.id}'),
      child: Container(
        width: 180,
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              child: CachedNetworkImage(imageUrl: vendor.displayImage, height: 110, width: double.infinity, fit: BoxFit.cover),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(vendor.businessName, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                  const SizedBox(height: 4),
                  Text(vendor.city, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.star, size: 12, color: AppColors.gold),
                      const SizedBox(width: 2),
                      Text(vendor.avgRating.toStringAsFixed(1), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 11)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(_price(vendor.startingPricePaise), style: const TextStyle(color: AppColors.brand, fontWeight: FontWeight.bold, fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FullScreenGallery extends StatefulWidget {
  final List<PortfolioItem> items;
  final int initialIndex;
  const _FullScreenGallery({required this.items, required this.initialIndex});

  @override
  State<_FullScreenGallery> createState() => _FullScreenGalleryState();
}

class _FullScreenGalleryState extends State<_FullScreenGallery> {
  late final PageController _controller;
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
        title: Text('${_current + 1} / ${widget.items.length}', style: const TextStyle(fontSize: 14)),
        centerTitle: true,
      ),
      body: PageView.builder(
        controller: _controller,
        itemCount: widget.items.length,
        onPageChanged: (index) => setState(() => _current = index),
        itemBuilder: (_, index) => InteractiveViewer(
          child: Center(
            child: CachedNetworkImage(
              imageUrl: widget.items[index].mediaUrl,
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
