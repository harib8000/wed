import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
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

// ─── Promotional banners ───────────────────────────────────
class _PromoBanner {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color bgColor;
  final Color textColor;
  const _PromoBanner({required this.title, required this.subtitle, required this.icon, required this.bgColor, required this.textColor});
}

const _promoBanners = [
  _PromoBanner(title: '🎉 Summer Wedding Sale', subtitle: 'Up to 30% off on top venues · Limited time!', icon: Icons.celebration, bgColor: Color(0xFFFDF4FF), textColor: Color(0xFFC026D3)),
  _PromoBanner(title: '📸 Featured: Srikanth Photography', subtitle: 'Award-winning candid & cinematic wedding films', icon: Icons.camera_enhance, bgColor: Color(0xFFECFDF5), textColor: Color(0xFF059669)),
  _PromoBanner(title: '💡 Planning Tip', subtitle: 'Book your venue at least 6 months in advance for best availability', icon: Icons.lightbulb, bgColor: Color(0xFFFEF3C7), textColor: Color(0xFFD97706)),
];

// ─── Quick action data ─────────────────────────────────────
class _QuickAction {
  final String label;
  final IconData icon;
  final Color color;
  final String route;
  const _QuickAction({required this.label, required this.icon, required this.color, required this.route});
}

const _quickActions = [
  _QuickAction(label: 'Checklist', icon: Icons.checklist, color: Color(0xFF7C3AED), route: '/checklist'),
  _QuickAction(label: 'Messages', icon: Icons.chat_bubble_outline, color: Color(0xFF2563EB), route: '/notifications'),
  _QuickAction(label: 'Bookings', icon: Icons.calendar_today, color: Color(0xFFDB2777), route: '/bookings'),
  _QuickAction(label: 'Wishlist', icon: Icons.favorite_border, color: Color(0xFFEA580C), route: '/wishlist'),
];

// ─── Home Screen ───────────────────────────────────────────
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _isLoading = true;
  final _bannerController = PageController();
  Timer? _bannerTimer;
  int _currentBannerPage = 0;

  @override
  void initState() {
    super.initState();
    // Simulate initial data loading
    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) setState(() => _isLoading = false);
    });
    // Auto-scroll banner
    _bannerTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted || !_bannerController.hasClients) return;
      _currentBannerPage = (_currentBannerPage + 1) % _promoBanners.length;
      _bannerController.animateToPage(
        _currentBannerPage,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  void dispose() {
    _bannerTimer?.cancel();
    _bannerController.dispose();
    super.dispose();
  }

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
              IconButton(icon: const Icon(Icons.notifications_outlined), onPressed: () => context.push('/notifications')),
            ],
          ),

          // ─── Personalized Greeting ─────
          SliverToBoxAdapter(
            child: _GreetingHeader(),
          ),

          // ─── Search Bar ────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
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

          // ─── Quick Action Buttons ──────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: _quickActions.map((action) => _QuickActionButton(action: action)).toList(),
              ),
            ),
          ),

          // ─── Promotional Banner Carousel ─
          SliverToBoxAdapter(
            child: _isLoading
                ? _buildBannerShimmer()
                : _PromoBannerCarousel(
                    controller: _bannerController,
                  ),
          ),

          // ─── Section: Categories ───────
          SliverToBoxAdapter(
            child: _SectionHeader(title: 'What Are You Looking For?', trailing: 'See All', onTrailingTap: () => context.push('/vendors')),
          ),

          // Top 3 Popular — Horizontal scroll (with shimmer)
          SliverToBoxAdapter(
            child: SizedBox(
              height: 180,
              child: _isLoading
                  ? _buildCategoryShimmer()
                  : ListView.separated(
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

          // Remaining categories — 3-column grid (with shimmer)
          _isLoading
              ? SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      mainAxisSpacing: 10,
                      crossAxisSpacing: 10,
                      childAspectRatio: 0.85,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => _buildGridShimmerItem(),
                      childCount: 6,
                    ),
                  ),
                )
              : SliverPadding(
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
              child: _SectionHeader(title: 'Trending This Week 🔥', trailing: 'View All', onTrailingTap: () => context.push('/vendors')),
            ),
          ),

          // Trending vendors (with shimmer)
          _isLoading
              ? SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _buildVendorCardShimmer(),
                      ),
                      childCount: 3,
                    ),
                  ),
                )
              : SliverPadding(
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

          // ─── Section: Recommended ──────
          if (!_isLoading) ...[
            SliverToBoxAdapter(
              child: _SectionHeader(title: 'Recommended for You ✨', trailing: 'View All', onTrailingTap: () => context.push('/vendors')),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 200,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _trendingVendors.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, index) {
                    final v = _trendingVendors[index];
                    return _RecommendedVendorCard(vendor: v);
                  },
                ),
              ),
            ),
          ],

          // Bottom spacing
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
    );
  }

  // ─── Shimmer Helpers ──────────────────────────────────────

  Widget _buildBannerShimmer() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      child: Shimmer.fromColors(
        baseColor: Colors.grey.shade200,
        highlightColor: Colors.grey.shade100,
        child: Container(
          height: 120,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryShimmer() {
    return ListView.separated(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: 3,
      separatorBuilder: (_, __) => const SizedBox(width: 12),
      itemBuilder: (context, index) => Shimmer.fromColors(
        baseColor: Colors.grey.shade200,
        highlightColor: Colors.grey.shade100,
        child: Container(
          width: 260,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }

  Widget _buildGridShimmerItem() {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade100,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
        ),
      ),
    );
  }

  Widget _buildVendorCardShimmer() {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade100,
      child: Container(
        height: 100,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
      ),
    );
  }
}

// ─── Personalized Greeting Header ──────────────────────────
class _GreetingHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // Calculate a sample countdown
    final weddingDate = DateTime.now().add(const Duration(days: 45));
    final daysLeft = weddingDate.difference(DateTime.now()).inDays;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hi there! 👋',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.brandLight,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '$daysLeft days to your big day! 💍',
                            style: TextStyle(color: AppColors.brand, fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              // Quick stats
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _MiniStat(label: 'Bookings', value: '3'),
                    const SizedBox(width: 10),
                    _MiniStat(label: 'Wishlist', value: '5'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  final String label;
  final String value;
  const _MiniStat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary)),
        Text(label, style: TextStyle(color: AppColors.textMuted, fontSize: 9)),
      ],
    );
  }
}

// ─── Quick Action Button ───────────────────────────────────
class _QuickActionButton extends StatelessWidget {
  final _QuickAction action;
  const _QuickActionButton({required this.action});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        context.push(action.route);
      },
      child: Column(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: action.color.withOpacity(0.1),
              shape: BoxShape.circle,
              border: Border.all(color: action.color.withOpacity(0.2)),
            ),
            child: Icon(action.icon, color: action.color, size: 24),
          ),
          const SizedBox(height: 6),
          Text(
            action.label,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}

// ─── Promotional Banner Carousel ───────────────────────────
class _PromoBannerCarousel extends StatelessWidget {
  final PageController controller;
  const _PromoBannerCarousel({required this.controller});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 120,
          child: PageView.builder(
            controller: controller,
            itemCount: _promoBanners.length,
            itemBuilder: (context, index) {
              final banner = _promoBanners[index];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  decoration: BoxDecoration(
                    color: banner.bgColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: banner.textColor.withOpacity(0.15)),
                  ),
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              banner.title,
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: banner.textColor),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              banner.subtitle,
                              style: TextStyle(color: banner.textColor.withOpacity(0.7), fontSize: 12, height: 1.4),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: banner.textColor.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(banner.icon, color: banner.textColor, size: 28),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 10),
        SmoothPageIndicator(
          controller: controller,
          count: _promoBanners.length,
          effect: ExpandingDotsEffect(
            dotHeight: 6,
            dotWidth: 6,
            activeDotColor: AppColors.brand,
            dotColor: AppColors.border,
            expansionFactor: 2.5,
          ),
        ),
        const SizedBox(height: 8),
      ],
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

// ─── Trending Vendor Card (with press animation) ───────────
class _TrendingVendorCard extends StatefulWidget {
  final _TrendingVendor vendor;
  const _TrendingVendorCard({required this.vendor});

  @override
  State<_TrendingVendorCard> createState() => _TrendingVendorCardState();
}

class _TrendingVendorCardState extends State<_TrendingVendorCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _scaleController;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.97).animate(
      CurvedAnimation(parent: _scaleController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _scaleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _scaleController.forward(),
      onTapUp: (_) {
        _scaleController.reverse();
        context.push('/vendors/${widget.vendor.id}');
      },
      onTapCancel: () => _scaleController.reverse(),
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) => Transform.scale(
          scale: _scaleAnimation.value,
          child: child,
        ),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border, width: 0.5),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 12, offset: const Offset(0, 4))],
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.only(topLeft: Radius.circular(16), bottomLeft: Radius.circular(16)),
                child: CachedNetworkImage(
                  imageUrl: widget.vendor.image,
                  width: 110,
                  height: 100,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Shimmer.fromColors(
                    baseColor: Colors.grey.shade200,
                    highlightColor: Colors.grey.shade100,
                    child: Container(width: 110, height: 100, color: Colors.white),
                  ),
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
                          Expanded(child: Text(widget.vendor.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis)),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: AppColors.brandLight, borderRadius: BorderRadius.circular(6)),
                            child: Text(widget.vendor.badge, style: TextStyle(color: AppColors.brand, fontSize: 9, fontWeight: FontWeight.w600)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.star, color: AppColors.gold, size: 14),
                          const SizedBox(width: 2),
                          Text('${widget.vendor.rating}', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                          Text(' (${widget.vendor.reviews})', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                          const SizedBox(width: 8),
                          Icon(Icons.location_on, color: AppColors.textMuted, size: 12),
                          Text(widget.vendor.city, style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(widget.vendor.price, style: TextStyle(color: AppColors.brand, fontWeight: FontWeight.bold, fontSize: 13)),
                          Row(
                            children: [
                              Icon(Icons.schedule, size: 11, color: AppColors.textMuted),
                              const SizedBox(width: 2),
                              Text('< 1 hr reply', style: TextStyle(color: AppColors.textMuted, fontSize: 10)),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Recommended Vendor Card (Horizontal Scroll) ───────────
class _RecommendedVendorCard extends StatelessWidget {
  final _TrendingVendor vendor;
  const _RecommendedVendorCard({required this.vendor});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/vendors/${vendor.id}'),
      child: Container(
        width: 180,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border, width: 0.5),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 10, offset: const Offset(0, 4))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(16), topRight: Radius.circular(16)),
              child: Stack(
                children: [
                  CachedNetworkImage(
                    imageUrl: vendor.image,
                    height: 110,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Shimmer.fromColors(
                      baseColor: Colors.grey.shade200,
                      highlightColor: Colors.grey.shade100,
                      child: Container(height: 110, color: Colors.white),
                    ),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.9),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.favorite_border, size: 16, color: AppColors.error),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(vendor.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.star, color: AppColors.gold, size: 12),
                      const SizedBox(width: 2),
                      Text('${vendor.rating}', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 11)),
                      Text(' · ${vendor.city}', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(vendor.price, style: TextStyle(color: AppColors.brand, fontWeight: FontWeight.bold, fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
