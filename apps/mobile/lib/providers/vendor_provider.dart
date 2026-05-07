import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_client.dart';
import '../models/vendor.dart';
import '../models/review.dart';

// ─── Vendor Search ────────────────────────────────────────────────────────────

class VendorSearchNotifier extends StateNotifier<AsyncValue<List<Vendor>>> {
  VendorSearchNotifier() : super(const AsyncValue.loading()) {
    search(const VendorFilter());
  }

  VendorFilter _currentFilter = const VendorFilter();

  VendorFilter get currentFilter => _currentFilter;

  Future<void> search(VendorFilter filter) async {
    _currentFilter = filter;
    state = const AsyncValue.loading();
    try {
      final res = await ApiClient.searchVendors(filter.toQueryParams());
      final data = res.data['data'] as Map<String, dynamic>;
      final vendors = (data['vendors'] as List<dynamic>? ?? data['hits'] as List<dynamic>? ?? [])
          .map((v) => Vendor.fromJson(v as Map<String, dynamic>))
          .toList();
      state = AsyncValue.data(vendors);
    } catch (e) {
      debugPrint('Vendor search failed, using mock data: $e');
      state = AsyncValue.data(_mockVendors);
    }
  }

  void updateFilter(VendorFilter filter) => search(filter);
}

final vendorSearchProvider =
    StateNotifierProvider<VendorSearchNotifier, AsyncValue<List<Vendor>>>(
  (ref) => VendorSearchNotifier(),
);

// ─── Single Vendor Detail ─────────────────────────────────────────────────────

final vendorDetailProvider = FutureProvider.family<Vendor, String>((ref, id) async {
  try {
    final res = await ApiClient.getVendor(id);
    return Vendor.fromJson(res.data['data']['vendor'] as Map<String, dynamic>);
  } catch (_) {
    return _mockVendors.firstWhere(
      (v) => v.id == id,
      orElse: () => _mockVendors.first,
    );
  }
});

// ─── Vendor Reviews ───────────────────────────────────────────────────────────

final vendorReviewsProvider = FutureProvider.family<List<Review>, String>((ref, vendorId) async {
  try {
    final res = await ApiClient.dio.get('/reviews/vendor/$vendorId');
    final reviews = (res.data['data']['reviews'] as List<dynamic>)
        .map((r) => Review.fromJson(r as Map<String, dynamic>))
        .toList();
    return reviews;
  } catch (_) {
    return _mockReviews;
  }
});

// ─── Wishlist ─────────────────────────────────────────────────────────────────

class WishlistNotifier extends StateNotifier<List<WishlistItem>> {
  WishlistNotifier() : super([]) {
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await ApiClient.dio.get('/users/me/wishlist');
      final items = (res.data['data']['wishlist'] as List<dynamic>)
          .map((i) => WishlistItem.fromJson(i as Map<String, dynamic>))
          .toList();
      state = items;
    } catch (_) {
      state = [];
    }
  }

  bool isWishlisted(String vendorId) => state.any((i) => i.vendorId == vendorId);

  Future<void> toggle(Vendor vendor) async {
    if (isWishlisted(vendor.id)) {
      await remove(vendor.id);
    } else {
      await add(vendor);
    }
  }

  Future<void> add(Vendor vendor) async {
    try {
      await ApiClient.addToWishlist(vendor.id);
    } catch (e) {
      debugPrint('Wishlist add API failed (offline-first): $e');
    }
    final item = WishlistItem(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      vendorCategory: vendor.category,
      vendorImage: vendor.displayImage,
      vendorCity: vendor.city,
      vendorRating: vendor.avgRating,
      vendorReviews: vendor.reviewCount,
      startingPricePaise: vendor.startingPricePaise,
    );
    state = [...state, item];
  }

  Future<void> remove(String vendorId) async {
    try {
      await ApiClient.removeFromWishlist(vendorId);
    } catch (e) {
      debugPrint('Wishlist remove API failed (offline-first): $e');
    }
    state = state.where((i) => i.vendorId != vendorId).toList();
  }
}

final wishlistProvider = StateNotifierProvider<WishlistNotifier, List<WishlistItem>>(
  (ref) => WishlistNotifier(),
);

// ─── Mock data fallbacks ──────────────────────────────────────────────────────

final _mockVendors = [
  Vendor(
    id: 'v1', businessName: 'Royal Grand Palace', slug: 'royal-grand-palace',
    category: 'VENUE', tagline: 'Where Dreams Become Reality',
    description: 'An exquisite wedding venue with palatial architecture, lush gardens, and state-of-the-art banquet halls hosting 200–2,000 guests.',
    city: 'Hyderabad', state: 'Telangana', avgRating: 4.9, reviewCount: 247, bookingCount: 1200,
    verified: true, isFeatured: true,
    portfolio: [
      const PortfolioItem(id: 'pi1', mediaUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80'),
      const PortfolioItem(id: 'pi2', mediaUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80'),
    ],
    packages: [
      const VendorPackage(id: 'p1', name: 'Silver', packageType: 'BASIC', priceFromPaise: 50000000, description: 'Basic hall + catering for 500 guests', inclusions: ['Main banquet hall', 'Veg catering 500 pax', 'Basic decor', 'Parking']),
      const VendorPackage(id: 'p2', name: 'Gold', packageType: 'STANDARD', priceFromPaise: 100000000, description: 'Premium full-service 800 guests', inclusions: ['Main + Outdoor lawn', 'Multi-cuisine 800 pax', 'Premium decor', 'DJ setup', 'Bridal suite']),
      const VendorPackage(id: 'p3', name: 'Platinum', packageType: 'PREMIUM', priceFromPaise: 180000000, description: 'Exclusive luxury for 1200 guests', inclusions: ['Exclusive 2-day booking', 'Royal catering 1200 pax', 'Grand decor + fireworks', 'Bridal & Groom suites']),
    ],
  ),
  Vendor(
    id: 'v2', businessName: 'Srikanth Photography', slug: 'srikanth-photography',
    category: 'PHOTOGRAPHY', tagline: 'Capturing Your Forever Moments',
    city: 'Hyderabad', state: 'Telangana', avgRating: 4.8, reviewCount: 189, bookingCount: 450,
    verified: true,
    portfolio: [
      const PortfolioItem(id: 'pi3', mediaUrl: 'https://images.unsplash.com/photo-1537907690979-13c0f6a4c7f4?w=600&q=80'),
      const PortfolioItem(id: 'pi4', mediaUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&q=80'),
    ],
    packages: [
      const VendorPackage(id: 'p4', name: 'Basic', packageType: 'BASIC', priceFromPaise: 8000000, inclusions: ['1 photographer', '300 edited photos', 'Online gallery']),
      const VendorPackage(id: 'p5', name: 'Standard', packageType: 'STANDARD', priceFromPaise: 12000000, inclusions: ['2 photographers', 'Drone', '500 photos', '5-min highlight video']),
      const VendorPackage(id: 'p6', name: 'Premium', packageType: 'PREMIUM', priceFromPaise: 18000000, inclusions: ['3 photographers', '2 videographers', 'Drone 4K', '1000 photos', '30-min film', 'Same-day teaser']),
    ],
  ),
  Vendor(
    id: 'v3', businessName: 'Flavours Catering Co.', slug: 'flavours-catering',
    category: 'CATERING', tagline: 'Taste the difference of excellence',
    city: 'Hyderabad', state: 'Telangana', avgRating: 4.7, reviewCount: 312, bookingCount: 800,
    verified: true,
    portfolio: [const PortfolioItem(id: 'pi5', mediaUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80')],
    packages: [
      const VendorPackage(id: 'p7', name: 'Basic', packageType: 'BASIC', priceFromPaise: 40000, description: '₹400/plate — Pure veg only', inclusions: ['Pure veg menu', 'Service staff', 'Cutlery & crockery']),
      const VendorPackage(id: 'p8', name: 'Standard', packageType: 'STANDARD', priceFromPaise: 80000, inclusions: ['Veg + non-veg', 'Live counters', 'Dessert station', 'Mocktails']),
      const VendorPackage(id: 'p9', name: 'Royal Feast', packageType: 'PREMIUM', priceFromPaise: 130000, inclusions: ['Multi-cuisine', 'Live stalls', '5-star quality', 'Custom menu', 'Butler service']),
    ],
  ),
  Vendor(
    id: 'v4', businessName: 'Blooms & Dreams Decor', slug: 'blooms-dreams-decor',
    category: 'DECORATION', tagline: 'Turning visions into breathtaking reality',
    city: 'Hyderabad', state: 'Telangana', avgRating: 4.9, reviewCount: 156, bookingCount: 320,
    portfolio: [const PortfolioItem(id: 'pi6', mediaUrl: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=600&q=80')],
    packages: [
      const VendorPackage(id: 'p10', name: 'Classic', packageType: 'BASIC', priceFromPaise: 8000000, inclusions: ['Stage decor', 'Floral arrangements', 'Table centerpieces']),
      const VendorPackage(id: 'p11', name: 'Luxury', packageType: 'PREMIUM', priceFromPaise: 20000000, inclusions: ['Full venue transformation', 'LED setup', 'Floral ceiling', 'Mandap', 'Centerpieces', 'Lighting']),
    ],
  ),
];

final _mockReviews = [
  Review(id: 'r1', vendorId: 'v1', customerId: 'u1', customerName: 'Priya M.', rating: 5.0, title: 'Perfect Wedding Venue!', body: 'Absolutely stunning venue! The staff was incredibly helpful and managed everything seamlessly. The décor was exactly as promised. Highly recommend!', qualityRating: 5.0, valueRating: 4.5, professionalismRating: 5.0, helpfulCount: 24, createdAt: DateTime.now().subtract(const Duration(days: 14))),
  Review(id: 'r2', vendorId: 'v1', customerId: 'u2', customerName: 'Rahul K.', rating: 4.8, body: 'Beautiful venue with spacious halls. Food was excellent. The outdoor lawn section was perfect for the sangeet ceremony.', helpfulCount: 18, createdAt: DateTime.now().subtract(const Duration(days: 30))),
  Review(id: 'r3', vendorId: 'v1', customerId: 'u3', customerName: 'Sneha R.', rating: 4.9, body: 'Worth every rupee! The bridal suite was gorgeous and the team coordinated everything perfectly. My wedding was a dream come true.', helpfulCount: 31, createdAt: DateTime.now().subtract(const Duration(days: 60))),
];
