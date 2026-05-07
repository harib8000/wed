class Review {
  final String id;
  final String vendorId;
  final String customerId;
  final String? customerName;
  final double rating;
  final String? title;
  final String body;
  final double? qualityRating;
  final double? valueRating;
  final double? professionalismRating;
  final List<String> photos;
  final String? vendorReply;
  final int helpfulCount;
  final DateTime createdAt;

  const Review({
    required this.id,
    required this.vendorId,
    required this.customerId,
    this.customerName,
    required this.rating,
    this.title,
    required this.body,
    this.qualityRating,
    this.valueRating,
    this.professionalismRating,
    this.photos = const [],
    this.vendorReply,
    this.helpfulCount = 0,
    required this.createdAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) => Review(
        id: json['id'] as String,
        vendorId: json['vendorId'] as String,
        customerId: json['customerId'] as String,
        customerName: json['customerName'] as String?,
        rating: (json['rating'] as num).toDouble(),
        title: json['title'] as String?,
        body: json['body'] as String,
        qualityRating: (json['qualityRating'] as num?)?.toDouble(),
        valueRating: (json['valueRating'] as num?)?.toDouble(),
        professionalismRating: (json['professionalismRating'] as num?)?.toDouble(),
        photos: (json['photos'] as List<dynamic>?)?.cast<String>() ?? [],
        vendorReply: json['vendorReply'] as String?,
        helpfulCount: json['helpfulCount'] as int? ?? 0,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}

class ReviewStats {
  final double avgRating;
  final int total;
  final double? avgQuality;
  final double? avgValue;
  final double? avgProfessionalism;

  const ReviewStats({
    required this.avgRating,
    required this.total,
    this.avgQuality,
    this.avgValue,
    this.avgProfessionalism,
  });

  factory ReviewStats.fromJson(Map<String, dynamic> stat) => ReviewStats(
        avgRating: (stat['_avg']?['rating'] as num?)?.toDouble() ?? 0,
        total: stat['_count']?['id'] as int? ?? 0,
        avgQuality: (stat['_avg']?['qualityRating'] as num?)?.toDouble(),
        avgValue: (stat['_avg']?['valueRating'] as num?)?.toDouble(),
        avgProfessionalism: (stat['_avg']?['professionalismRating'] as num?)?.toDouble(),
      );
}

class WishlistItem {
  final String id;
  final String vendorId;
  final String vendorName;
  final String vendorCategory;
  final String? vendorImage;
  final String vendorCity;
  final double vendorRating;
  final int vendorReviews;
  final int? startingPricePaise;

  const WishlistItem({
    required this.id,
    required this.vendorId,
    required this.vendorName,
    required this.vendorCategory,
    this.vendorImage,
    required this.vendorCity,
    required this.vendorRating,
    required this.vendorReviews,
    this.startingPricePaise,
  });

  factory WishlistItem.fromJson(Map<String, dynamic> json) => WishlistItem(
        id: json['id'] as String,
        vendorId: json['vendorId'] as String,
        vendorName: json['vendorName'] as String,
        vendorCategory: json['vendorCategory'] as String,
        vendorImage: json['vendorImage'] as String?,
        vendorCity: json['vendorCity'] as String,
        vendorRating: (json['vendorRating'] as num?)?.toDouble() ?? 0,
        vendorReviews: json['vendorReviews'] as int? ?? 0,
        startingPricePaise: json['startingPricePaise'] as int?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'vendorId': vendorId,
        'vendorName': vendorName,
        'vendorCategory': vendorCategory,
        if (vendorImage != null) 'vendorImage': vendorImage,
        'vendorCity': vendorCity,
        'vendorRating': vendorRating,
        'vendorReviews': vendorReviews,
        if (startingPricePaise != null) 'startingPricePaise': startingPricePaise,
      };
}
