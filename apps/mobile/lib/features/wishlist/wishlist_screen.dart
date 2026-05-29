import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';
import '../../models/review.dart';
import '../../providers/vendor_provider.dart';
import '../../shared/widgets/empty_state_widget.dart';

class WishlistScreen extends ConsumerStatefulWidget {
  const WishlistScreen({super.key});

  @override
  ConsumerState<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends ConsumerState<WishlistScreen> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final wishlist = ref.watch(wishlistProvider);
    final filtered = wishlist.where((item) {
      final query = _query.toLowerCase();
      return query.isEmpty || item.vendorName.toLowerCase().contains(query) || item.vendorCity.toLowerCase().contains(query) || item.vendorCategory.toLowerCase().contains(query);
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('My Wishlist', style: TextStyle(fontFamily: 'PlayfairDisplay', fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        actions: [
          if (wishlist.isNotEmpty)
            TextButton(
              onPressed: () => _confirmClearAll(context, ref),
              child: const Text('Clear all', style: TextStyle(color: AppColors.error)),
            ),
        ],
      ),
      body: Column(
        children: [
          if (wishlist.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: TextField(
                onChanged: (value) => setState(() => _query = value),
                decoration: const InputDecoration(prefixIcon: Icon(Icons.search), hintText: 'Search saved vendors'),
              ),
            ),
          Expanded(
            child: filtered.isEmpty
                ? _query.isNotEmpty
                    ? const EmptyStateWidget(icon: Icons.search_off, title: 'No matches', message: 'Try a different keyword or clear the search.')
                    : _EmptyWishlist(onExplore: () => context.go('/vendors'))
                : _WishlistGrid(items: filtered),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmClearAll(BuildContext context, WidgetRef ref) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear Wishlist'),
        content: const Text('Remove all saved vendors from your wishlist?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), style: ElevatedButton.styleFrom(backgroundColor: AppColors.error), child: const Text('Clear all', style: TextStyle(color: Colors.white))),
        ],
      ),
    );
    if (confirm == true) {
      final notifier = ref.read(wishlistProvider.notifier);
      final items = ref.read(wishlistProvider);
      for (final item in items) {
        await notifier.remove(item.vendorId);
      }
    }
  }
}

class _EmptyWishlist extends StatelessWidget {
  const _EmptyWishlist({required this.onExplore});
  final VoidCallback onExplore;

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      icon: Icons.favorite_border_rounded,
      title: 'Your wishlist is empty',
      message: 'Save vendors you love by tapping the heart icon on their profiles.',
      actionLabel: 'Explore Vendors',
      onAction: onExplore,
    );
  }
}

class _WishlistGrid extends ConsumerWidget {
  const _WishlistGrid({required this.items});
  final List<WishlistItem> items;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          sliver: SliverToBoxAdapter(
            child: Text('${items.length} saved vendor${items.length == 1 ? '' : 's'}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 14, fontWeight: FontWeight.w500)),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, mainAxisSpacing: 16, crossAxisSpacing: 16, childAspectRatio: 0.72),
            delegate: SliverChildBuilderDelegate((context, index) => _WishlistCard(item: items[index]), childCount: items.length),
          ),
        ),
        const SliverToBoxAdapter(child: SizedBox(height: 100)),
      ],
    );
  }
}

class _WishlistCard extends ConsumerWidget {
  const _WishlistCard({required this.item});
  final WishlistItem item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final priceLakh = item.startingPricePaise != null ? (item.startingPricePaise! / 100000).toStringAsFixed(1) : null;

    return GestureDetector(
      onTap: () => context.push('/vendors/${item.vendorId}'),
      child: Container(
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 12, offset: const Offset(0, 4))]),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                  child: AspectRatio(
                    aspectRatio: 1.1,
                    child: CachedNetworkImage(
                      imageUrl: item.vendorImage ?? 'https://via.placeholder.com/300x300.png?text=No+Image',
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(color: const Color(0xFFF3F4F6), child: const Center(child: CircularProgressIndicator(strokeWidth: 2))),
                      errorWidget: (_, __, ___) => Container(color: const Color(0xFFF3F4F6), child: const Icon(Icons.image_not_supported_rounded, color: AppColors.textSecondary)),
                    ),
                  ),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: GestureDetector(
                    onTap: () => ref.read(wishlistProvider.notifier).remove(item.vendorId),
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 6)]),
                      child: const Icon(Icons.favorite_rounded, color: AppColors.error, size: 18),
                    ),
                  ),
                ),
                Positioned(
                  bottom: 8,
                  left: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(gradient: const LinearGradient(colors: [AppColors.brand, AppColors.gold]), borderRadius: BorderRadius.circular(20)),
                    child: Text(item.vendorCategory.toLowerCase().replaceAll('_', ' '), style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.vendorName, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.textPrimary)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.location_on_rounded, size: 11, color: AppColors.textSecondary),
                      const SizedBox(width: 2),
                      Expanded(child: Text(item.vendorCity, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary), overflow: TextOverflow.ellipsis)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.star_rounded, size: 13, color: AppColors.gold),
                      const SizedBox(width: 2),
                      Text(item.vendorRating.toStringAsFixed(1), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                      const SizedBox(width: 4),
                      Text('(${item.vendorReviews})', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                    ],
                  ),
                  if (priceLakh != null) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: AppColors.brand.withOpacity(0.08), borderRadius: BorderRadius.circular(8)),
                      child: Text('From ₹$priceLakh L', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.brand)),
                    ),
                  ],
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            HapticFeedback.lightImpact();
                            ScaffoldMessenger.of(context)
                              ..hideCurrentSnackBar()
                              ..showSnackBar(SnackBar(content: Text('${item.vendorName} saved for compare.')));
                          },
                          icon: const Icon(Icons.compare_arrows_rounded, size: 15),
                          label: const Text('Compare'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => context.push('/checkout/${item.vendorId}'),
                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.brand, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 8), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), elevation: 0, textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                          child: const Text('Book Now'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
