import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme.dart';

// ─── Mock vendor detail data ───────────────────────────────
class _VendorDetail {
  final String id, name, category, city, description, price, image;
  final double rating;
  final int reviews, bookings;
  final bool verified;
  final List<String> portfolio;
  final List<_Package> packages;
  final List<_Review> reviewList;

  const _VendorDetail({
    required this.id, required this.name, required this.category, required this.city,
    required this.description, required this.rating, required this.reviews,
    required this.bookings, required this.price, required this.image,
    this.verified = false, this.portfolio = const [], this.packages = const [],
    this.reviewList = const [],
  });
}

class _Package {
  final String name, description, price;
  final List<String> includes;
  const _Package({required this.name, required this.description, required this.price, required this.includes});
}

class _Review {
  final String author, text, date;
  final double rating;
  const _Review({required this.author, required this.text, required this.date, required this.rating});
}

final _vendorMap = <String, _VendorDetail>{
  'v1': const _VendorDetail(
    id: 'v1', name: 'Royal Grand Palace', category: 'Venue', city: 'Hyderabad',
    description: 'An exquisite wedding venue with palatial architecture, lush gardens, and state-of-the-art banquet halls that can host 200 to 2,000 guests.',
    rating: 4.9, reviews: 247, bookings: 1200, price: '₹5,00,000', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80', verified: true,
    portfolio: ['https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&q=80', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&q=80', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&q=80'],
    packages: [_Package(name: 'Silver', description: 'Basic hall + catering', price: '₹5,00,000', includes: ['Main banquet hall', 'Veg catering (500 pax)', 'Basic decor', 'Parking']),
      _Package(name: 'Gold', description: 'Premium full-service', price: '₹10,00,000', includes: ['Main + Outdoor lawn', 'Multi-cuisine (800 pax)', 'Premium decor + LED', 'DJ setup', 'Bridal suite']),
      _Package(name: 'Platinum', description: 'Ultra luxury destination', price: '₹18,00,000', includes: ['Exclusive venue booking (2 days)', 'Royal catering (1200 pax)', 'Grand decor + fireworks', 'Bridal + Groom suites', 'Valet parking', 'Complimentary rooms'])],
    reviewList: [_Review(author: 'Priya M.', text: 'Absolutely stunning venue! The staff was incredibly helpful and managed everything seamlessly.', date: '2 weeks ago', rating: 5.0),
      _Review(author: 'Rahul K.', text: 'Beautiful decor, spacious halls. Food was excellent. Would definitely recommend.', date: '1 month ago', rating: 4.8)],
  ),
};

class VendorDetailScreen extends StatelessWidget {
  final String vendorId;
  const VendorDetailScreen({super.key, required this.vendorId});

  @override
  Widget build(BuildContext context) {
    final vendor = _vendorMap[vendorId] ?? _vendorMap['v1']!;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // ─── Hero Image App Bar ────────
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(imageUrl: vendor.image, fit: BoxFit.cover),
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
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (vendor.verified)
                          Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(color: AppColors.brand, borderRadius: BorderRadius.circular(8)),
                            child: const Row(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.verified, color: Colors.white, size: 12), SizedBox(width: 4), Text('Verified Vendor', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600))]),
                          ),
                        Text(vendor.name, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Row(children: [
                          Icon(Icons.location_on, color: Colors.white.withOpacity(0.8), size: 14),
                          const SizedBox(width: 4),
                          Text('${vendor.city} · ${vendor.category}', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 13)),
                        ]),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              IconButton(icon: const Icon(Icons.favorite_border, color: Colors.white), onPressed: () {}),
              IconButton(icon: const Icon(Icons.share, color: Colors.white), onPressed: () {}),
            ],
          ),

          // ─── Stats Row ─────────────────
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _StatItem(icon: Icons.star, value: '${vendor.rating}', label: 'Rating', color: AppColors.gold),
                  Container(width: 1, height: 40, color: AppColors.border),
                  _StatItem(icon: Icons.rate_review, value: '${vendor.reviews}', label: 'Reviews', color: AppColors.brand),
                  Container(width: 1, height: 40, color: AppColors.border),
                  _StatItem(icon: Icons.event_available, value: '${vendor.bookings}+', label: 'Bookings', color: Colors.green),
                ],
              ),
            ),
          ),

          // ─── Description ───────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('About', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  const SizedBox(height: 8),
                  Text(vendor.description, style: TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.5)),
                ],
              ),
            ),
          ),

          // ─── Portfolio ─────────────────
          if (vendor.portfolio.isNotEmpty) ...[
            const SliverToBoxAdapter(child: Padding(padding: EdgeInsets.fromLTRB(16, 24, 16, 12), child: Text('Portfolio', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)))),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 120,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: vendor.portfolio.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (_, i) => ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: CachedNetworkImage(imageUrl: vendor.portfolio[i], width: 140, height: 120, fit: BoxFit.cover),
                  ),
                ),
              ),
            ),
          ],

          // ─── Packages ─────────────────
          if (vendor.packages.isNotEmpty) ...[
            const SliverToBoxAdapter(child: Padding(padding: EdgeInsets.fromLTRB(16, 24, 16, 12), child: Text('Packages', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)))),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, i) => _PackageCard(package: vendor.packages[i], index: i),
                  childCount: vendor.packages.length,
                ),
              ),
            ),
          ],

          // ─── Reviews ──────────────────
          if (vendor.reviewList.isNotEmpty) ...[
            const SliverToBoxAdapter(child: Padding(padding: EdgeInsets.fromLTRB(16, 24, 16, 12), child: Text('Reviews', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)))),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, i) => _ReviewCard(review: vendor.reviewList[i]),
                  childCount: vendor.reviewList.length,
                ),
              ),
            ),
          ],
        ],
      ),

      // ─── Bottom CTA ───────────────────
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, -4))],
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Starting from', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                    Text(vendor.price, style: TextStyle(color: AppColors.brand, fontWeight: FontWeight.bold, fontSize: 20)),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.brand, foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Send Enquiry', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Widgets ───────────────────────────────────────────────
class _StatItem extends StatelessWidget {
  final IconData icon;
  final String value, label;
  final Color color;
  const _StatItem({required this.icon, required this.value, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        Text(label, style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
      ],
    );
  }
}

class _PackageCard extends StatelessWidget {
  final _Package package;
  final int index;
  const _PackageCard({required this.package, required this.index});

  static const _colors = [Color(0xFFEDE9FE), Color(0xFFFEF3C7), Color(0xFFFCE7F3)];
  static const _borderColors = [Color(0xFFC084FC), Color(0xFFFBBF24), Color(0xFFF472B6)];

  @override
  Widget build(BuildContext context) {
    final bgColor = _colors[index % _colors.length];
    final borderColor = _borderColors[index % _borderColors.length];

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(package.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              Text(package.price, style: TextStyle(color: AppColors.brand, fontWeight: FontWeight.bold, fontSize: 16)),
            ],
          ),
          const SizedBox(height: 4),
          Text(package.description, style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8, runSpacing: 6,
            children: package.includes.map((item) => Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.check_circle, color: Colors.green, size: 14),
                const SizedBox(width: 4),
                Text(item, style: const TextStyle(fontSize: 12)),
              ],
            )).toList(),
          ),
        ],
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  final _Review review;
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(children: [
                CircleAvatar(radius: 16, backgroundColor: AppColors.brandLight, child: Text(review.author[0], style: TextStyle(color: AppColors.brand, fontWeight: FontWeight.bold))),
                const SizedBox(width: 10),
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(review.author, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  Text(review.date, style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                ]),
              ]),
              Row(
                children: [
                  const Icon(Icons.star, color: AppColors.gold, size: 14),
                  const SizedBox(width: 2),
                  Text('${review.rating}', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(review.text, style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4)),
        ],
      ),
    );
  }
}
