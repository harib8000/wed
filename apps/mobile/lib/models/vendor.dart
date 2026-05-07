// ─── Vendor Package ───────────────────────────────────────────────────────────

class VendorPackage {
  final String id;
  final String name;
  final String packageType;
  final int priceFromPaise;
  final int? priceUpToPaise;
  final bool isCustomQuote;
  final String? description;
  final List<String> inclusions;
  final List<String> exclusions;

  const VendorPackage({
    required this.id,
    required this.name,
    required this.packageType,
    required this.priceFromPaise,
    this.priceUpToPaise,
    this.isCustomQuote = false,
    this.description,
    this.inclusions = const [],
    this.exclusions = const [],
  });

  factory VendorPackage.fromJson(Map<String, dynamic> json) => VendorPackage(
        id: json['id'] as String,
        name: json['name'] as String,
        packageType: json['packageType'] as String? ?? 'BASIC',
        priceFromPaise: json['priceFromPaise'] as int,
        priceUpToPaise: json['priceUpToPaise'] as int?,
        isCustomQuote: json['isCustomQuote'] as bool? ?? false,
        description: json['description'] as String?,
        inclusions: (json['inclusions'] as List<dynamic>?)?.cast<String>() ?? [],
        exclusions: (json['exclusions'] as List<dynamic>?)?.cast<String>() ?? [],
      );
}

// ─── Portfolio Item ───────────────────────────────────────────────────────────

class PortfolioItem {
  final String id;
  final String mediaUrl;
  final String? caption;
  final String mediaType; // 'image' | 'video'

  const PortfolioItem({
    required this.id,
    required this.mediaUrl,
    this.caption,
    this.mediaType = 'image',
  });

  factory PortfolioItem.fromJson(Map<String, dynamic> json) => PortfolioItem(
        id: json['id'] as String,
        mediaUrl: json['mediaUrl'] as String,
        caption: json['caption'] as String?,
        mediaType: json['mediaType'] as String? ?? 'image',
      );
}

// ─── Vendor ────────────────────────────────────────────────────────────────────

class Vendor {
  final String id;
  final String businessName;
  final String slug;
  final String category;
  final String? tagline;
  final String? description;
  final String city;
  final String state;
  final double avgRating;
  final int reviewCount;
  final int bookingCount;
  final bool verified;
  final bool plusMember;
  final bool isFeatured;
  final List<VendorPackage> packages;
  final List<PortfolioItem> portfolio;
  final String? whatsappNumber;
  final String? websiteUrl;
  final String? instagramUrl;

  const Vendor({
    required this.id,
    required this.businessName,
    required this.slug,
    required this.category,
    this.tagline,
    this.description,
    required this.city,
    required this.state,
    required this.avgRating,
    required this.reviewCount,
    required this.bookingCount,
    this.verified = false,
    this.plusMember = false,
    this.isFeatured = false,
    this.packages = const [],
    this.portfolio = const [],
    this.whatsappNumber,
    this.websiteUrl,
    this.instagramUrl,
  });

  factory Vendor.fromJson(Map<String, dynamic> json) => Vendor(
        id: json['id'] as String,
        businessName: json['businessName'] as String,
        slug: json['slug'] as String? ?? json['id'] as String,
        category: json['category'] as String,
        tagline: json['tagline'] as String?,
        description: json['description'] as String?,
        city: json['city'] as String,
        state: json['state'] as String? ?? '',
        avgRating: (json['avgRating'] as num?)?.toDouble() ?? 0.0,
        reviewCount: json['reviewCount'] as int? ?? 0,
        bookingCount: json['bookingCount'] as int? ?? 0,
        verified: json['verified'] as bool? ?? false,
        plusMember: json['plusMember'] as bool? ?? false,
        isFeatured: json['isFeatured'] as bool? ?? false,
        packages: (json['packages'] as List<dynamic>?)
                ?.map((p) => VendorPackage.fromJson(p as Map<String, dynamic>))
                .toList() ??
            [],
        portfolio: (json['portfolio'] as List<dynamic>?)
                ?.map((p) => PortfolioItem.fromJson(p as Map<String, dynamic>))
                .toList() ??
            [],
        whatsappNumber: json['whatsappNumber'] as String?,
        websiteUrl: json['websiteUrl'] as String?,
        instagramUrl: json['instagramUrl'] as String?,
      );

  // Starting price from cheapest active package
  int? get startingPricePaise {
    if (packages.isEmpty) return null;
    return packages.map((p) => p.priceFromPaise).reduce((a, b) => a < b ? a : b);
  }

  String get displayImage {
    if (portfolio.isNotEmpty) return portfolio.first.mediaUrl;
    return _fallbackImage(category);
  }

  static String _fallbackImage(String category) {
    const map = {
      'VENUE': 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80',
      'PHOTOGRAPHY': 'https://images.unsplash.com/photo-1537907690979-13c0f6a4c7f4?w=600&q=80',
      'CATERING': 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80',
      'DECORATION': 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=600&q=80',
      'MAKEUP': 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=600&q=80',
      'MUSIC': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
    };
    return map[category.toUpperCase()] ??
        'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&q=80';
  }
}

// ─── Vendor Filter ────────────────────────────────────────────────────────────

class VendorFilter {
  final String? query;
  final String? category;
  final String? city;
  final String sortBy;
  final int page;

  const VendorFilter({
    this.query,
    this.category,
    this.city,
    this.sortBy = 'relevance',
    this.page = 1,
  });

  Map<String, dynamic> toQueryParams() => {
        if (query != null && query!.isNotEmpty) 'q': query,
        if (category != null && category!.isNotEmpty) 'category': category,
        if (city != null && city!.isNotEmpty) 'city': city,
        'sortBy': sortBy,
        'page': page,
        'limit': 20,
      };

  VendorFilter copyWith({
    String? query,
    String? category,
    String? city,
    String? sortBy,
    int? page,
  }) =>
      VendorFilter(
        query: query ?? this.query,
        category: category ?? this.category,
        city: city ?? this.city,
        sortBy: sortBy ?? this.sortBy,
        page: page ?? this.page,
      );
}
