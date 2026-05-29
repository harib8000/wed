import 'package:cached_network_image/cached_network_image.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/error_state_widget.dart';

class AiSuggestion {
  final String id;
  final String name;
  final String category;
  final String city;
  final double rating;
  final String price;
  final String imageUrl;
  final String reason;
  final String recommendationTag;

  const AiSuggestion({
    required this.id,
    required this.name,
    required this.category,
    required this.city,
    required this.rating,
    required this.price,
    required this.imageUrl,
    required this.reason,
    required this.recommendationTag,
  });

  factory AiSuggestion.fromJson(Map<String, dynamic> json) {
    return AiSuggestion(
      id: json['id']?.toString() ?? DateTime.now().microsecondsSinceEpoch.toString(),
      name: json['name']?.toString() ?? 'Recommended Vendor',
      category: json['category']?.toString() ?? 'Vendor',
      city: json['city']?.toString() ?? 'Hyderabad',
      rating: (json['rating'] as num?)?.toDouble() ?? 4.7,
      price: json['price']?.toString() ?? '₹50K onwards',
      imageUrl: json['imageUrl']?.toString() ??
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80',
      reason: json['reason']?.toString() ?? 'Great fit for your wedding plan.',
      recommendationTag: json['recommendationTag']?.toString() ?? 'AI match',
    );
  }
}

class AiRecommendationFilter {
  final String budget;
  final String category;

  const AiRecommendationFilter({required this.budget, required this.category});

  @override
  bool operator ==(Object other) {
    return other is AiRecommendationFilter &&
        other.budget == budget &&
        other.category == category;
  }

  @override
  int get hashCode => Object.hash(budget, category);
}

final _budgetFilterProvider = StateProvider<String>((ref) => '₹20-30L');
final _categoryFilterProvider = StateProvider<String>((ref) => 'All');

final aiSuggestionsProvider = FutureProvider.family<List<AiSuggestion>, AiRecommendationFilter>(
  (ref, filter) async {
    try {
      final response = await ApiClient.dio.get(
        '/ai/recommendations',
        queryParameters: {
          'budget': filter.budget,
          if (filter.category != 'All') 'category': filter.category,
        },
      );
      final data = response.data;
      List<dynamic> items = const [];
      if (data is Map<String, dynamic>) {
        final payload = data['data'];
        if (payload is Map<String, dynamic>) {
          items = (payload['recommendations'] as List<dynamic>?) ?? const [];
        } else if (payload is List<dynamic>) {
          items = payload;
        }
      }
      if (items.isNotEmpty) {
        return items
            .map((item) => AiSuggestion.fromJson(item as Map<String, dynamic>))
            .toList();
      }
      return _filterSuggestions(filter);
    } on DioException {
      return _filterSuggestions(filter);
    } catch (_) {
      return _filterSuggestions(filter);
    }
  },
);

class AiSuggestionsScreen extends ConsumerWidget {
  const AiSuggestionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final budget = ref.watch(_budgetFilterProvider);
    final category = ref.watch(_categoryFilterProvider);
    final filter = AiRecommendationFilter(budget: budget, category: category);
    final asyncSuggestions = ref.watch(aiSuggestionsProvider(filter));

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('AI Wedding Planner')),
      body: asyncSuggestions.when(
        loading: _AiLoadingGrid.new,
        error: (error, _) => ErrorStateWidget(
          message: 'Unable to fetch AI recommendations right now.',
          onRetry: () => ref.refresh(aiSuggestionsProvider(filter).future),
        ),
        data: (suggestions) {
          return RefreshIndicator(
            color: AppColors.brand,
            onRefresh: () => ref.refresh(aiSuggestionsProvider(filter).future),
            child: suggestions.isEmpty
                ? ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: [
                      SizedBox(
                        height: MediaQuery.of(context).size.height * 0.7,
                        child: EmptyStateWidget(
                          icon: Icons.auto_awesome_outlined,
                          title: 'No suggestions yet',
                          message: 'Try a different budget or category to get fresh AI-curated ideas.',
                          actionLabel: 'Reset filters',
                          onAction: () {
                            ref.read(_budgetFilterProvider.notifier).state = '₹20-30L';
                            ref.read(_categoryFilterProvider.notifier).state = 'All';
                          },
                        ),
                      ),
                    ],
                  )
                : ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                    children: [
                      const _AiHeroHeader(),
                      const SizedBox(height: 16),
                      _AiInsightBanner(budget: budget),
                      const SizedBox(height: 20),
                      Text('Budget range', style: Theme.of(context).textTheme.titleLarge),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _budgetOptions
                            .map(
                              (option) => ChoiceChip(
                                label: Text(option),
                                selected: option == budget,
                                selectedColor: AppColors.brand,
                                labelStyle: TextStyle(
                                  color: option == budget ? Colors.white : AppColors.textPrimary,
                                  fontWeight: FontWeight.w600,
                                ),
                                onSelected: (_) async {
                                  await HapticFeedback.lightImpact();
                                  ref.read(_budgetFilterProvider.notifier).state = option;
                                },
                              ),
                            )
                            .toList(),
                      ),
                      const SizedBox(height: 20),
                      Text('Category', style: Theme.of(context).textTheme.titleLarge),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _categoryOptions
                            .map(
                              (option) => ChoiceChip(
                                label: Text(option),
                                selected: option == category,
                                selectedColor: AppColors.gold,
                                labelStyle: TextStyle(
                                  color: option == category ? Colors.white : AppColors.textPrimary,
                                  fontWeight: FontWeight.w600,
                                ),
                                onSelected: (_) async {
                                  await HapticFeedback.lightImpact();
                                  ref.read(_categoryFilterProvider.notifier).state = option;
                                },
                              ),
                            )
                            .toList(),
                      ),
                      const SizedBox(height: 20),
                      Text('Suggested vendors', style: Theme.of(context).textTheme.titleLarge),
                      const SizedBox(height: 12),
                      ...suggestions.map(
                        (suggestion) => Padding(
                          padding: const EdgeInsets.only(bottom: 14),
                          child: _AiSuggestionCard(suggestion: suggestion),
                        ),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: () => _showRequestPlanDialog(context),
                        icon: const Icon(Icons.call_outlined),
                        label: const Text('Request Custom Plan'),
                      ),
                    ],
                  ),
          );
        },
      ),
    );
  }

  Future<void> _showRequestPlanDialog(BuildContext context) async {
    final phoneController = TextEditingController();

    await HapticFeedback.lightImpact();
    if (!context.mounted) return;

    await showDialog<void>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Request Custom Plan'),
          content: TextField(
            controller: phoneController,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'Phone number',
              hintText: '9876543210',
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                await HapticFeedback.lightImpact();
                if (!context.mounted) return;
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      'Our wedding planner will call ${phoneController.text.trim().isEmpty ? 'you shortly' : phoneController.text.trim()}.',
                    ),
                  ),
                );
              },
              child: const Text('Submit'),
            ),
          ],
        );
      },
    );
  }
}

class _AiHeroHeader extends StatelessWidget {
  const _AiHeroHeader();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.brand, Color(0xFF9333EA)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.16),
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 30),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AI Wedding Planner',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Curated suggestions based on your preferences',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withOpacity(0.88),
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AiInsightBanner extends StatelessWidget {
  final String budget;

  const _AiInsightBanner({required this.budget});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.goldLight,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.gold.withOpacity(0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.insights_outlined, color: AppColors.gold),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Based on your wedding date (March 2025) and budget ($budget), here are our top picks.',
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AiSuggestionCard extends StatelessWidget {
  final AiSuggestion suggestion;

  const _AiSuggestionCard({required this.suggestion});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(24),
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: () async {
          await HapticFeedback.lightImpact();
          if (!context.mounted) return;
          context.go('/vendors/${suggestion.id}');
        },
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                child: CachedNetworkImage(
                  imageUrl: suggestion.imageUrl,
                  height: 180,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    height: 180,
                    color: AppColors.brandLight,
                    alignment: Alignment.center,
                    child: const CircularProgressIndicator(strokeWidth: 2),
                  ),
                  errorWidget: (context, url, error) => Container(
                    height: 180,
                    color: AppColors.brandLight,
                    alignment: Alignment.center,
                    child: const Icon(Icons.image_not_supported_outlined),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.brandLight,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            suggestion.category,
                            style: const TextStyle(
                              color: AppColors.brand,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.goldLight,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            suggestion.recommendationTag,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      suggestion.name,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 18),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded, color: AppColors.gold, size: 18),
                        const SizedBox(width: 4),
                        Text(
                          suggestion.rating.toStringAsFixed(1),
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(width: 12),
                        const Icon(Icons.location_on_outlined, size: 18, color: AppColors.textSecondary),
                        const SizedBox(width: 4),
                        Text(suggestion.city, style: const TextStyle(color: AppColors.textSecondary)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      suggestion.price,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Why we suggest: ${suggestion.reason}',
                      style: const TextStyle(
                        fontStyle: FontStyle.italic,
                        color: AppColors.textSecondary,
                        height: 1.4,
                      ),
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

class _AiLoadingGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: 6,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.72,
      ),
      itemBuilder: (_, __) => Shimmer.fromColors(
        baseColor: Colors.grey[300]!,
        highlightColor: Colors.grey[100]!,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
          ),
        ),
      ),
    );
  }
}

List<AiSuggestion> _filterSuggestions(AiRecommendationFilter filter) {
  return _mockSuggestions.where((suggestion) {
    final matchesCategory = filter.category == 'All' || suggestion.category == filter.category;
    final matchesBudget = switch (filter.budget) {
      'Under ₹10L' => suggestion.category == 'Makeup' || suggestion.category == 'Mehendi',
      '₹10-20L' => suggestion.category != 'Venue',
      '₹20-30L' => true,
      'Above ₹30L' => suggestion.category == 'Venue' || suggestion.category == 'Decor' || suggestion.category == 'Photography',
      _ => true,
    };
    return matchesCategory && matchesBudget;
  }).toList();
}

const _budgetOptions = <String>['Under ₹10L', '₹10-20L', '₹20-30L', 'Above ₹30L'];
const _categoryOptions = <String>['All', 'Venue', 'Photography', 'Catering', 'Decor', 'Makeup', 'Music', 'Videography'];

const _mockSuggestions = <AiSuggestion>[
  AiSuggestion(
    id: 'v1',
    name: 'Royal Grand Palace',
    category: 'Venue',
    city: 'Hyderabad',
    rating: 4.9,
    price: '₹5L onwards',
    imageUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80',
    reason: 'Top rated in Hyderabad with expansive indoor halls suited for March weddings.',
    recommendationTag: 'Top rated in Hyderabad',
  ),
  AiSuggestion(
    id: 'v2',
    name: 'Srikanth Photography',
    category: 'Photography',
    city: 'Hyderabad',
    rating: 4.8,
    price: '₹80K onwards',
    imageUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80',
    reason: 'Best value for mid-budget couples wanting candid and cinematic coverage.',
    recommendationTag: 'Best value for budget',
  ),
  AiSuggestion(
    id: 'v3',
    name: 'Flavours Catering',
    category: 'Catering',
    city: 'Hyderabad',
    rating: 4.7,
    price: '₹800/plate',
    imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80',
    reason: 'Popular for Telugu wedding menus with live dosa and chaats counters.',
    recommendationTag: 'Crowd favourite menu',
  ),
  AiSuggestion(
    id: 'v4',
    name: 'Blooms & Dreams',
    category: 'Decor',
    city: 'Hyderabad',
    rating: 4.9,
    price: '₹1.5L onwards',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
    reason: 'Strong floral work for haldi, mehendi, and reception themes in pastel palettes.',
    recommendationTag: 'Available on your date',
  ),
  AiSuggestion(
    id: 'v5',
    name: 'Glow Bridal Studio',
    category: 'Makeup',
    city: 'Hyderabad',
    rating: 4.6,
    price: '₹25K onwards',
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
    reason: 'Known for soft glam bridal looks that work well for humid Hyderabad evenings.',
    recommendationTag: 'Perfect bridal styling',
  ),
  AiSuggestion(
    id: 'v6',
    name: 'Beats & Bass DJ',
    category: 'Music',
    city: 'Hyderabad',
    rating: 4.5,
    price: '₹35K onwards',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
    reason: 'Great pick for high-energy sangeet nights with Telugu and Bollywood mashups.',
    recommendationTag: 'Sangeet favourite',
  ),
  AiSuggestion(
    id: 'v7',
    name: 'Cinematic Reels',
    category: 'Videography',
    city: 'Hyderabad',
    rating: 4.8,
    price: '₹60K onwards',
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80',
    reason: 'Ideal for couples wanting teaser films and Instagram-ready same-day edits.',
    recommendationTag: 'Trending reels expert',
  ),
  AiSuggestion(
    id: 'v8',
    name: 'Nawab Signature Caterers',
    category: 'Catering',
    city: 'Hyderabad',
    rating: 4.7,
    price: '₹950/plate',
    imageUrl: 'https://images.unsplash.com/photo-1464306076886-da185f6a9d05?w=800&q=80',
    reason: 'Excellent biryani and dessert spreads for large family gatherings and walima events.',
    recommendationTag: 'Premium feast option',
  ),
];
