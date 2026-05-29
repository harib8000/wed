import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import '../../core/theme.dart';
import '../../models/vendor.dart';
import '../../providers/auth_provider.dart';
import '../../providers/booking_provider.dart';
import '../../providers/vendor_provider.dart';
import '../notifications/notifications_screen.dart';

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
  WeddingCategory(id: 'VENUE', label: 'Wedding Venues', subtitle: 'Function halls · hotels · resorts', icon: Icons.location_city, count: '2,400+', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80', color: Color(0xFF7C3AED), popular: true),
  WeddingCategory(id: 'PHOTOGRAPHY', label: 'Photography', subtitle: 'Candid · traditional · pre-wedding', icon: Icons.camera_alt, count: '1,800+', image: 'https://images.unsplash.com/photo-1537907690979-13c0f6a4c7f4?w=600&q=80', color: Color(0xFFDB2777), popular: true),
  WeddingCategory(id: 'CATERING', label: 'Catering', subtitle: 'Multi-cuisine · live counters · biryani', icon: Icons.restaurant, count: '1,200+', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80', color: Color(0xFFEA580C), popular: true),
  WeddingCategory(id: 'DECORATION', label: 'Decor & Flowers', subtitle: 'Stage · mandap · LED · floral', icon: Icons.local_florist, count: '900+', image: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=600&q=80', color: Color(0xFFD97706)),
  WeddingCategory(id: 'MAKEUP', label: 'Makeup & Beauty', subtitle: 'Bridal · airbrush · HD', icon: Icons.face_retouching_natural, count: '750+', image: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=600&q=80', color: Color(0xFFE11D48)),
  WeddingCategory(id: 'MUSIC', label: 'Music & DJ', subtitle: 'Live band · DJ · dhol', icon: Icons.music_note, count: '600+', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80', color: Color(0xFF2563EB)),
  WeddingCategory(id: 'VIDEOGRAPHY', label: 'Videography', subtitle: 'Cinematic · drone · highlights', icon: Icons.videocam, count: '500+', image: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=600&q=80', color: Color(0xFF4F46E5)),
  WeddingCategory(id: 'TRANSPORT', label: 'Wedding Cars', subtitle: 'Vintage · luxury · horse cart', icon: Icons.directions_car, count: '400+', image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', color: Color(0xFF16A34A)),
  WeddingCategory(id: 'MEHENDI', label: 'Mehendi Artists', subtitle: 'Bridal · Arabic · Rajasthani', icon: Icons.brush, count: '300+', image: 'https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=600&q=80', color: Color(0xFF059669)),
];

class _PromoBanner {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color bgColor;
  final Color textColor;
  const _PromoBanner({required this.title, required this.subtitle, required this.icon, required this.bgColor, required this.textColor});
}

const _promoBanners = [
  _PromoBanner(title: '🎉 Summer Wedding Sale', subtitle: 'Up to 30% off on top venues · limited time!', icon: Icons.celebration, bgColor: Color(0xFFFDF4FF), textColor: Color(0xFFC026D3)),
  _PromoBanner(title: '📸 Candid stories that feel real', subtitle: 'Compare photographers, save favourites, and book faster.', icon: Icons.camera_enhance, bgColor: Color(0xFFECFDF5), textColor: Color(0xFF059669)),
  _PromoBanner(title: '💡 Planning Tip', subtitle: 'Lock your venue early to secure the best date and pricing.', icon: Icons.lightbulb, bgColor: Color(0xFFFEF3C7), textColor: Color(0xFFD97706)),
];

class _QuickAction {
  final String label;
  final IconData icon;
  final Color color;
  final String route;
  const _QuickAction({required this.label, required this.icon, required this.color, required this.route});
}

const _quickActions = [
  _QuickAction(label: 'Checklist', icon: Icons.checklist, color: Color(0xFF7C3AED), route: '/checklist'),
  _QuickAction(label: 'Bookings', icon: Icons.calendar_today, color: Color(0xFFDB2777), route: '/bookings'),
  _QuickAction(label: 'Wishlist', icon: Icons.favorite_border, color: Color(0xFFEA580C), route: '/wishlist'),
  _QuickAction(label: 'Messages', icon: Icons.chat_bubble_outline, color: Color(0xFF2563EB), route: '/notifications'),
];

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  static const _recentlyViewedBoxName = 'recently_viewed_vendors';

  bool _isLoading = true;
  final _bannerController = PageController();
  Timer? _bannerTimer;
  Box<Map<dynamic, dynamic>>? _recentlyViewedBox;
  List<_RecentlyViewedVendor> _recentlyViewed = const [];

  @override
  void initState() {
    super.initState();
    Future<void>.delayed(const Duration(milliseconds: 1000), () {
      if (mounted) setState(() => _isLoading = false);
    });
    _bannerTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted || !_bannerController.hasClients) return;
      final nextPage = ((_bannerController.page ?? 0).round() + 1) % _promoBanners.length;
      _bannerController.animateToPage(
        nextPage,
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOut,
      );
    });
    _initRecentlyViewed();
  }

  Future<void> _initRecentlyViewed() async {
    final box = await Hive.openBox<Map<dynamic, dynamic>>(_recentlyViewedBoxName);
    final vendors = box.values
        .map((raw) => _RecentlyViewedVendor.fromMap(Map<dynamic, dynamic>.from(raw)))
        .toList()
      ..sort((a, b) => b.viewedAt.compareTo(a.viewedAt));
    if (!mounted) return;
    setState(() {
      _recentlyViewedBox = box;
      _recentlyViewed = vendors.take(8).toList();
    });
    box.listenable().addListener(_refreshRecentlyViewed);
  }

  void _refreshRecentlyViewed() {
    final box = _recentlyViewedBox;
    if (box == null || !mounted) return;
    final vendors = box.values
        .map((raw) => _RecentlyViewedVendor.fromMap(Map<dynamic, dynamic>.from(raw)))
        .toList()
      ..sort((a, b) => b.viewedAt.compareTo(a.viewedAt));
    setState(() => _recentlyViewed = vendors.take(8).toList());
  }

  @override
  void dispose() {
    _bannerTimer?.cancel();
    _bannerController.dispose();
    _recentlyViewedBox?.listenable().removeListener(_refreshRecentlyViewed);
    super.dispose();
  }

  Future<void> _openQuickPlanner() async {
    HapticFeedback.lightImpact();
    final route = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Quick planner', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              Text('Jump back into the tasks that move your plan forward.', style: TextStyle(color: AppColors.textMuted)),
              const SizedBox(height: 18),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: const [
                  _PlannerAction(title: 'Checklist', subtitle: 'Track to-dos', icon: Icons.checklist_rounded, route: '/checklist', color: Color(0xFF7C3AED)),
                  _PlannerAction(title: 'Bookings', subtitle: 'View payments', icon: Icons.calendar_month_rounded, route: '/bookings', color: Color(0xFFDB2777)),
                  _PlannerAction(title: 'Wishlist', subtitle: 'Saved ideas', icon: Icons.favorite_rounded, route: '/wishlist', color: Color(0xFFEA580C)),
                  _PlannerAction(title: 'Explore', subtitle: 'Find vendors', icon: Icons.travel_explore_rounded, route: '/vendors', color: Color(0xFF2563EB)),
                ].map((action) => _PlannerActionTile(action: action)).toList(),
              ),
            ],
          ),
        ),
      ),
    );
    if (!mounted || route == null) return;
    context.push(route);
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final bookings = ref.watch(bookingsProvider).valueOrNull ?? const [];
    final wishlist = ref.watch(wishlistProvider);
    final unreadCount = ref.watch(unreadCountProvider);
    final vendors = ref.watch(vendorSearchProvider).valueOrNull ?? const <Vendor>[];
    final recommended = vendors.isNotEmpty ? vendors.take(6).toList() : const <Vendor>[];
    final popularCategories = _categories.where((c) => c.popular).toList();
    final otherCategories = _categories.where((c) => !c.popular).toList();

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openQuickPlanner,
        backgroundColor: AppColors.brand,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.auto_awesome),
        label: const Text('Quick Planner'),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await Future.wait([
            ref.read(bookingsProvider.notifier).load(),
            ref.read(vendorSearchProvider.notifier).search(const VendorFilter()),
            ref.read(notificationsProvider.notifier).load(),
          ]);
          _refreshRecentlyViewed();
        },
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              floating: true,
              snap: true,
              title: Row(
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [AppColors.brand, Color(0xFF9333EA)]),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Center(
                      child: Text('W', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text('Wedding OS', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: 20)),
                ],
              ),
              actions: [
                Stack(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.notifications_outlined),
                      onPressed: () => context.push('/notifications'),
                    ),
                    if (unreadCount > 0)
                      Positioned(
                        right: 10,
                        top: 10,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                          decoration: BoxDecoration(color: AppColors.error, borderRadius: BorderRadius.circular(10)),
                          child: Text(
                            unreadCount > 9 ? '9+' : '$unreadCount',
                            style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
            SliverToBoxAdapter(
              child: _GreetingHeader(
                name: user?.name ?? 'Hi there',
                weddingDate: user?.weddingDate,
                bookingCount: bookings.length,
                wishlistCount: wishlist.length,
                budgetPaise: user?.budgetPaise,
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: GestureDetector(
                  onTap: () => context.push('/vendors'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.search, color: AppColors.textMuted, size: 20),
                        const SizedBox(width: 12),
                        Expanded(child: Text('Search venues, photographers, caterers...', style: TextStyle(color: AppColors.textMuted, fontSize: 14))),
                        const Icon(Icons.arrow_forward_ios, size: 14, color: AppColors.textMuted),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: _quickActions.map((action) => _QuickActionButton(action: action)).toList(),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: _isLoading ? _buildBannerShimmer() : _PromoBannerCarousel(controller: _bannerController),
            ),
            SliverToBoxAdapter(
              child: _SectionHeader(
                title: 'What are you looking for?',
                trailing: 'See all',
                onTrailingTap: () => context.push('/vendors'),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 180,
                child: _isLoading
                    ? _buildCategoryShimmer()
                    : ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: popularCategories.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 12),
                        itemBuilder: (context, index) => _PopularCategoryCard(category: popularCategories[index]),
                      ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 16)),
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
                      delegate: SliverChildBuilderDelegate((context, index) => _buildGridShimmerItem(), childCount: 6),
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
                        (context, index) => _CompactCategoryCard(category: otherCategories[index]),
                        childCount: otherCategories.length,
                      ),
                    ),
                  ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.only(top: 24),
                child: _SectionHeader(
                  title: 'Trending this week 🔥',
                  trailing: 'View all',
                  onTrailingTap: () => context.push('/vendors'),
                ),
              ),
            ),
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
                          final vendor = recommended.isNotEmpty ? recommended[index] : null;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: vendor == null ? _buildVendorCardShimmer() : _TrendingVendorCard(vendor: vendor),
                          );
                        },
                        childCount: recommended.isNotEmpty ? recommended.take(4).length : 3,
                      ),
                    ),
                  ),
            if (!_isLoading && recommended.isNotEmpty) ...[
              SliverToBoxAdapter(
                child: _SectionHeader(
                  title: 'Recommended for you ✨',
                  trailing: 'View all',
                  onTrailingTap: () => context.push('/vendors'),
                ),
              ),
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 220,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: recommended.take(6).length,
                    separatorBuilder: (_, __) => const SizedBox(width: 12),
                    itemBuilder: (context, index) => _RecommendedVendorCard(vendor: recommended[index]),
                  ),
                ),
              ),
            ],
            if (_recentlyViewed.isNotEmpty) ...[
              SliverToBoxAdapter(
                child: _SectionHeader(
                  title: 'Recently viewed',
                  trailing: 'Explore',
                  onTrailingTap: () => context.push('/vendors'),
                ),
              ),
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 120,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _recentlyViewed.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 12),
                    itemBuilder: (context, index) => _RecentlyViewedCard(vendor: _recentlyViewed[index]),
                  ),
                ),
              ),
            ],
            const SliverToBoxAdapter(child: SizedBox(height: 90)),
          ],
        ),
      ),
    );
  }

  Widget _buildBannerShimmer() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      child: Shimmer.fromColors(
        baseColor: Colors.grey.shade200,
        highlightColor: Colors.grey.shade100,
        child: Container(
          height: 120,
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
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
        child: Container(width: 260, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16))),
      ),
    );
  }

  static Widget _buildGridShimmerItem() {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade100,
      child: Container(decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14))),
    );
  }

  Widget _buildVendorCardShimmer() {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade100,
      child: Container(
        height: 100,
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      ),
    );
  }
}

class _GreetingHeader extends StatelessWidget {
  final String name;
  final String? weddingDate;
  final int bookingCount;
  final int wishlistCount;
  final int? budgetPaise;

  const _GreetingHeader({
    required this.name,
    required this.weddingDate,
    required this.bookingCount,
    required this.wishlistCount,
    required this.budgetPaise,
  });

  @override
  Widget build(BuildContext context) {
    final parsedWeddingDate = DateTime.tryParse(weddingDate ?? '');
    final eventDate = parsedWeddingDate ?? DateTime.now().add(const Duration(days: 45));
    final daysLeft = eventDate.difference(DateTime.now()).inDays.clamp(0, 9999);
    final budgetLakhs = budgetPaise != null ? (budgetPaise! / 10000000).toStringAsFixed(1) : null;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hi, ${name.split(' ').first}! 👋',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(color: AppColors.brandLight, borderRadius: BorderRadius.circular(10)),
                      child: Text(
                        '$daysLeft days to your big day 💍',
                        style: const TextStyle(color: AppColors.brand, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _MiniStat(label: 'Bookings', value: '$bookingCount'),
                    const SizedBox(width: 12),
                    _MiniStat(label: 'Wishlist', value: '$wishlistCount'),
                  ],
                ),
              ),
            ],
          ),
          if (budgetLakhs != null) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: AppColors.brandLight, borderRadius: BorderRadius.circular(12)),
                    child: const Icon(Icons.account_balance_wallet_outlined, color: AppColors.brand),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Budget tracker', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                        const SizedBox(height: 2),
                        Text('Planned budget ₹$budgetLakhs L', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                      ],
                    ),
                  ),
                  Text('On track', style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.w700, fontSize: 12)),
                ],
              ),
            ),
          ],
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
          Text(action.label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}

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
                            Text(banner.title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: banner.textColor)),
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
                        decoration: BoxDecoration(color: banner.textColor.withOpacity(0.1), shape: BoxShape.circle),
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
          effect: const ExpandingDotsEffect(
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
              child: Text(trailing!, style: const TextStyle(color: AppColors.brand, fontSize: 13, fontWeight: FontWeight.w600)),
            ),
        ],
      ),
    );
  }
}

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
                  gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [category.color.withOpacity(0.1), category.color.withOpacity(0.85)]),
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
                gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [category.color.withOpacity(0.1), category.color.withOpacity(0.8)]),
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
                  Text(category.count, style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 9)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TrendingVendorCard extends StatelessWidget {
  final Vendor vendor;
  const _TrendingVendorCard({required this.vendor});

  String _formatPrice(int? paise) {
    if (paise == null) return 'Custom pricing';
    final amount = paise ~/ 100;
    if (amount >= 100000) {
      return '₹${(amount / 100000).toStringAsFixed(1)}L onwards';
    }
    if (amount >= 1000) {
      return '₹${(amount / 1000).toStringAsFixed(0)}K onwards';
    }
    return '₹$amount onwards';
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        context.push('/vendors/${vendor.id}');
      },
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
              child: CachedNetworkImage(imageUrl: vendor.displayImage, width: 110, height: 100, fit: BoxFit.cover),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(child: Text(vendor.businessName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis)),
                        if (vendor.verified)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: AppColors.brandLight, borderRadius: BorderRadius.circular(6)),
                            child: const Text('Verified', style: TextStyle(color: AppColors.brand, fontSize: 9, fontWeight: FontWeight.w600)),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.star, color: AppColors.gold, size: 14),
                        const SizedBox(width: 2),
                        Text(vendor.avgRating.toStringAsFixed(1), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                        Text(' (${vendor.reviewCount})', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                        const SizedBox(width: 8),
                        Icon(Icons.location_on, color: AppColors.textMuted, size: 12),
                        Expanded(child: Text(vendor.city, style: TextStyle(color: AppColors.textMuted, fontSize: 11), overflow: TextOverflow.ellipsis)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(_formatPrice(vendor.startingPricePaise), style: const TextStyle(color: AppColors.brand, fontWeight: FontWeight.bold, fontSize: 13)),
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
    );
  }
}

class _RecommendedVendorCard extends ConsumerWidget {
  final Vendor vendor;
  const _RecommendedVendorCard({required this.vendor});

  String _price(int? paise) {
    if (paise == null) return 'Custom pricing';
    final rupees = paise ~/ 100;
    return rupees >= 100000 ? '₹${(rupees / 100000).toStringAsFixed(1)}L' : '₹${(rupees / 1000).toStringAsFixed(0)}K';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isWishlisted = ref.watch(wishlistProvider.select((items) => items.any((item) => item.vendorId == vendor.id)));
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
                  CachedNetworkImage(imageUrl: vendor.displayImage, height: 110, width: double.infinity, fit: BoxFit.cover),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: GestureDetector(
                      onTap: () async {
                        HapticFeedback.lightImpact();
                        await ref.read(wishlistProvider.notifier).toggle(vendor);
                      },
                      child: Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(color: Colors.white.withOpacity(0.92), shape: BoxShape.circle),
                        child: Icon(isWishlisted ? Icons.favorite : Icons.favorite_border, size: 16, color: AppColors.error),
                      ),
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
                  Text(vendor.businessName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.star, color: AppColors.gold, size: 12),
                      const SizedBox(width: 2),
                      Text(vendor.avgRating.toStringAsFixed(1), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 11)),
                      Expanded(child: Text(' · ${vendor.city}', style: TextStyle(color: AppColors.textMuted, fontSize: 11), overflow: TextOverflow.ellipsis)),
                    ],
                  ),
                  const SizedBox(height: 4),
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

class _RecentlyViewedVendor {
  final String id;
  final String name;
  final String city;
  final String imageUrl;
  final DateTime viewedAt;

  const _RecentlyViewedVendor({required this.id, required this.name, required this.city, required this.imageUrl, required this.viewedAt});

  factory _RecentlyViewedVendor.fromMap(Map<dynamic, dynamic> map) => _RecentlyViewedVendor(
        id: map['id'] as String? ?? '',
        name: map['name'] as String? ?? 'Vendor',
        city: map['city'] as String? ?? '',
        imageUrl: map['imageUrl'] as String? ?? '',
        viewedAt: DateTime.tryParse(map['viewedAt'] as String? ?? '') ?? DateTime.now(),
      );
}

class _RecentlyViewedCard extends StatelessWidget {
  final _RecentlyViewedVendor vendor;
  const _RecentlyViewedCard({required this.vendor});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/vendors/${vendor.id}'),
      child: Container(
        width: 220,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: CachedNetworkImage(imageUrl: vendor.imageUrl, width: 72, height: 72, fit: BoxFit.cover),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(vendor.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 12, color: AppColors.textMuted),
                      const SizedBox(width: 3),
                      Expanded(child: Text(vendor.city, style: TextStyle(color: AppColors.textMuted, fontSize: 11), overflow: TextOverflow.ellipsis)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text('Viewed recently', style: TextStyle(color: AppColors.brand, fontSize: 11, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PlannerAction {
  final String title;
  final String subtitle;
  final IconData icon;
  final String route;
  final Color color;
  const _PlannerAction({required this.title, required this.subtitle, required this.icon, required this.route, required this.color});
}

class _PlannerActionTile extends StatelessWidget {
  final _PlannerAction action;
  const _PlannerActionTile({required this.action});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.of(context).pop(action.route),
      child: Container(
        width: (MediaQuery.of(context).size.width - 52) / 2,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: action.color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: action.color.withOpacity(0.16)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
              child: Icon(action.icon, color: action.color),
            ),
            const SizedBox(height: 12),
            Text(action.title, style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text(action.subtitle, style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
