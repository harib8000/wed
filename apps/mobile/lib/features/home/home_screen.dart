import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

// ─── Category data model ───────────────────────────────────
class WeddingCategory {
  final String id;
  final String label;
  final String subtitle;
  final IconData icon;
  final String count;
  final String image;
  final Color color;
  final bool popular;

  const WeddingCategory({
    required this.id,
    required this.label,
    required this.subtitle,
    required this.icon,
    required this.count,
    required this.image,
    required this.color,
    this.popular = false,
  });
}

const _categories = [
  WeddingCategory(id: 'venue', label: 'Wedding Venues', subtitle: 'Function Halls · Hotels · Resorts', icon: Icons.location_city, count: '2,400+', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80', color: Color(0xFF7C3AED), popular: true),
  WeddingCategory(id: 'photography', label: 'Photography', subtitle: 'Candid · Traditional · Pre-wedding', icon: Icons.camera_alt, count: '1,800+', image: 'https://images.unsplash.com/photo-1537907690979-13c0f6a4c7f4?w=600&q=80', color: Color(0xFFDB2777), popular: true),
  WeddingCategory(id: 'catering', label: 'Catering', subtitle: 'Multi-cuisine · Live Counters · Biryani', icon: Icons.restaurant, count: '1,200+', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80', color: Color(0xFFEA580C), popular: true),
  WeddingCategory(id: 'decor', label: 'Decor & Flowers', subtitle: 'Stage · Mandap · LED · Floral', icon: Icons.local_florist, count: '900+', image: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=600&q=80', color: Color(0xFFD97706), popular: false),
  WeddingCategory(id: 'makeup', label: 'Makeup & Beauty', subtitle: 'Bridal · Airbrush · HD', icon: Icons.face_retouching_natural, count: '750+', image: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=600&q=80', color: Color(0xFFE11D48), popular: false),
  WeddingCategory(id: 'music', label: 'Music & DJ', subtitle: 'Live Band · DJ · Dhol', icon: Icons.music_note, count: '600+', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80', color: Color(0xFF2563EB), popular: false),
  WeddingCategory(id: 'videography', label: 'Videography', subtitle: 'Cinematic · Drone · Highlights', icon: Icons.videocam, count: '500+', image: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=600&q=80', color: Color(0xFF4F46E5), popular: false),
  WeddingCategory(id: 'transport', label: 'Wedding Cars', subtitle: 'Vintage · Luxury · Horse Cart', icon: Icons.directions_car, count: '400+', image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', color: Color(0xFF16A34A), popular: false),
  WeddingCategory(id: 'mehendi', label: 'Mehendi Artists', subtitle: 'Bridal · Arabic · Rajasthani', icon: Icons.brush, count: '300+', image: 'https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=600&q=80', color: Color(0xFF059669), popular: false),
];

// ─── Trending vendor ───────────────────────────────────────
class _TrendingVendor {
  final String id, name, category, city, price, image, badge;
  final double rating;
  final int reviews;
  const _TrendingVendor({required this.id, required this.name, required this.category, required this.city, required this.rating, required this.reviews, required this.price, required this.image, required this.badge});
}

const _trendingVendors = [
  _TrendingVendor(id: 'v1', name: 'Royal Grand Palace', category: 'Venue', city: 'Hyderabad', rating: 4.9, reviews: 247, price: '₹5L onwards', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&q=80', badge: 'Top Rated'),
  _TrendingVendor(id: 'v2', name: 'Srikanth Photography', category: 'Photography', city: 'Hyderabad', rating: 4.8, reviews: 189, price: '₹80K onwards', image: 'https://images.unsplash.com/photo-1537907690979-13c0f6a4c7f4?w=400&q=80', badge: 'Verified Pro'),
  _TrendingVendor(id: 'v3', name: 'Flavours Catering', category: 'Catering', city: 'Hyderabad', rating: 4.7, reviews: 312, price: '₹800/plate', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=400&q=80', badge: 'Most Booked'),
  _TrendingVendor(id: 'v4', name: 'Blooms & Dreams', category: 'Decor', city: 'Hyderabad', rating: 4.9, reviews: 156, price: '₹1.5L onwards', image: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=400&q=80', badge: 'Award Winner'),
];

// ─── Home Screen ───────────────────────────────────────────
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // ─── App Bar ───────────────────
          SliverAppBar(
            floating: true,
            snap: true,
            title: Row(
              children: [
                Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [AppColors.brand, Color(0xFF9333EA)]),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Center(child: Text('W', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14))),
                ),
                const SizedBox(width: 8),
                Text('Wedding OS', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: 20)),
              ],
            ),
            actions: [
              IconButton(icon: const Icon(Icons.notifications_outlined), onPressed: () {}),
            ],
          ),

          // ─── Search Bar ────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: GestureDetector(
                onTap: () => context.push('/vendors'),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.border),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.search, color: AppColors.textMuted, size: 20),
                      const SizedBox(width: 12),
                      Text('Search venues, photographers...', style: TextStyle(color: AppColors.textMuted, fontSize: 14)),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // ─── Section: Categories ───────
          SliverToBoxAdapter(
            child: _SectionHeader(title: 'What Are You Looking For?', trailing: 'See All', onTrailingTap: () => context.push('/vendors')),
          ),

          // Top 3 Popular — Horizontal scroll
          SliverToBoxAdapter(
            child: SizedBox(
              height: 180,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _categories.where((c) => c.popular).length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (context, index) {
                  final cat = _categories.where((c) => c.popular).toList()[index];
                  return _PopularCategoryCard(category: cat);
                },
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 16)),

          // Remaining categories — 2-column grid within a SliverPadding
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 0.85,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final cat = _categories.where((c) => !c.popular).toList()[index];
                  return _CompactCategoryCard(category: cat);
                },
                childCount: _categories.where((c) => !c.popular).length,
              ),
            ),
          ),

          // ─── Section: Trending ─────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.only(top: 24),
              child: _SectionHeader(title: 'Trending This Week', trailing: 'View All', onTrailingTap: () => context.push('/vendors')),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final v = _trendingVendors[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _TrendingVendorCard(vendor: v),
                  );
                },
                childCount: _trendingVendors.length,
              ),
            ),
          ),

          // Bottom spacing
          const SliverToBoxAdapter(child: SizedBox(height: 16)),
        ],
      ),
    );
  }
}

// ─── Section Header Widget ─────────────────────────────────
class _SectionHeader extends StatelessWidget {
  final String title;
  final String? trailing;
  final VoidCallback? onTrailingTap;
  const _SectionHeader({required this.title, this.trailing, this.onTrailingTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          if (trailing != null)
            GestureDetector(
              onTap: onTrailingTap,
              child: Text(trailing!, style: TextStyle(color: AppColors.brand, fontSize: 13, fontWeight: FontWeight.w600)),
            ),
        ],
      ),
    );
  }
}

// ─── Popular Category Card (Large, Horizontal) ─────────────
class _PopularCategoryCard extends StatelessWidget {
  final WeddingCategory category;
  const _PopularCategoryCard({required this.category});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/vendors?category=${category.id}'),
      child: Container(
        width: 260,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, 4))],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Stack(
            fit: StackFit.expand,
            children: [
              CachedNetworkImage(imageUrl: category.image, fit: BoxFit.cover),
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [category.color.withOpacity(0.1), category.color.withOpacity(0.85)],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(10)),
                          child: Icon(category.icon, color: Colors.white, size: 20),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(20)),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.local_fire_department, color: Colors.white, size: 12),
                              SizedBox(width: 4),
                              Text('Popular', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(category.label, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 2),
                        Text(category.subtitle, style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 11)),
                        const SizedBox(height: 4),
                        Text('${category.count} vendors', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Compact Category Card (Grid) ──────────────────────────
class _CompactCategoryCard extends StatelessWidget {
  final WeddingCategory category;
  const _CompactCategoryCard({required this.category});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/vendors?category=${category.id}'),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: Stack(
          fit: StackFit.expand,
          children: [
            CachedNetworkImage(imageUrl: category.image, fit: BoxFit.cover),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [category.color.withOpacity(0.1), category.color.withOpacity(0.8)],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                    child: Icon(category.icon, color: Colors.white, size: 16),
                  ),
                  const SizedBox(height: 6),
                  Text(category.label, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                  Text('${category.count}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 9)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Trending Vendor Card ──────────────────────────────────
class _TrendingVendorCard extends StatelessWidget {
  final _TrendingVendor vendor;
  const _TrendingVendorCard({required this.vendor});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/vendors/${vendor.id}'),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border, width: 0.5),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(16), bottomLeft: Radius.circular(16)),
              child: CachedNetworkImage(
                imageUrl: vendor.image,
                width: 110,
                height: 100,
                fit: BoxFit.cover,
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(child: Text(vendor.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis)),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(color: AppColors.brandLight, borderRadius: BorderRadius.circular(6)),
                          child: Text(vendor.badge, style: TextStyle(color: AppColors.brand, fontSize: 9, fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.star, color: AppColors.gold, size: 14),
                        const SizedBox(width: 2),
                        Text('${vendor.rating}', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                        Text(' (${vendor.reviews})', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                        const SizedBox(width: 8),
                        Icon(Icons.location_on, color: AppColors.textMuted, size: 12),
                        Text(vendor.city, style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(vendor.price, style: TextStyle(color: AppColors.brand, fontWeight: FontWeight.bold, fontSize: 13)),
                        Text(vendor.category, style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
