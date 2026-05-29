import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:shimmer/shimmer.dart';

import '../../core/theme.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/error_state_widget.dart';

const _recentSearchesBoxName = 'recent_searches';
const _maxRecentSearches = 8;

class SearchVendor {
  final String id;
  final String name;
  final String category;
  final String city;
  final double rating;
  final String price;
  final String imageUrl;
  final bool verified;

  const SearchVendor({
    required this.id,
    required this.name,
    required this.category,
    required this.city,
    required this.rating,
    required this.price,
    required this.imageUrl,
    required this.verified,
  });
}

class SearchState {
  final String query;
  final List<SearchVendor> results;
  final bool isLoading;
  final String selectedCategory;
  final String selectedCity;
  final String? errorMessage;

  const SearchState({
    this.query = '',
    this.results = const [],
    this.isLoading = false,
    this.selectedCategory = 'All',
    this.selectedCity = 'All',
    this.errorMessage,
  });

  SearchState copyWith({
    String? query,
    List<SearchVendor>? results,
    bool? isLoading,
    String? selectedCategory,
    String? selectedCity,
    String? errorMessage,
    bool clearError = false,
  }) {
    return SearchState(
      query: query ?? this.query,
      results: results ?? this.results,
      isLoading: isLoading ?? this.isLoading,
      selectedCategory: selectedCategory ?? this.selectedCategory,
      selectedCity: selectedCity ?? this.selectedCity,
      errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
    );
  }
}

class SearchNotifier extends StateNotifier<SearchState> {
  SearchNotifier() : super(const SearchState());

  Future<void> search(String query) async {
    state = state.copyWith(query: query, isLoading: true, clearError: true);
    try {
      await Future<void>.delayed(const Duration(milliseconds: 350));
      final normalizedQuery = query.trim().toLowerCase();
      var results = _mockSearchVendors.where((vendor) {
        final matchesQuery = normalizedQuery.isEmpty ||
            vendor.name.toLowerCase().contains(normalizedQuery) ||
            vendor.category.toLowerCase().contains(normalizedQuery) ||
            vendor.city.toLowerCase().contains(normalizedQuery);
        final matchesCategory = state.selectedCategory == 'All' ||
            vendor.category == state.selectedCategory;
        final matchesCity =
            state.selectedCity == 'All' || vendor.city == state.selectedCity;
        return matchesQuery && matchesCategory && matchesCity;
      }).toList();

      results.sort((a, b) => b.rating.compareTo(a.rating));

      state = state.copyWith(
        query: query,
        results: results,
        isLoading: false,
        clearError: true,
      );
    } catch (error) {
      state = state.copyWith(
        query: query,
        isLoading: false,
        errorMessage: 'Unable to search vendors right now. Please try again.',
      );
    }
  }

  Future<void> setCategory(String category) async {
    state = state.copyWith(selectedCategory: category);
    await search(state.query);
  }

  Future<void> setCity(String city) async {
    state = state.copyWith(selectedCity: city);
    await search(state.query);
  }

  Future<void> refresh() => search(state.query);
}

class SearchScreen extends StatefulWidget {
  final String initialQuery;

  const SearchScreen({super.key, this.initialQuery = ''});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  late final SearchNotifier _notifier;
  late final TextEditingController _controller;
  late final FocusNode _focusNode;
  late final void Function(SearchState) _listener;
  Timer? _debounce;
  Box<String>? _recentSearchesBox;
  List<String> _recentSearches = const [];
  bool _isBoxLoading = true;
  String? _boxError;

  @override
  void initState() {
    super.initState();
    _notifier = SearchNotifier();
    _controller = TextEditingController(text: widget.initialQuery);
    _focusNode = FocusNode();
    _listener = (_) {
      if (mounted) {
        setState(() {});
      }
    };
    _notifier.addListener(_listener);
    _openRecentSearches();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _notifier.search(widget.initialQuery);
      _focusNode.requestFocus();
    });
  }

  Future<void> _openRecentSearches() async {
    try {
      final box = await Hive.openBox<String>(_recentSearchesBoxName);
      if (!mounted) return;
      setState(() {
        _recentSearchesBox = box;
        _recentSearches = box.values.toList().reversed.toList();
        _isBoxLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _boxError = 'Unable to load recent searches.';
        _isBoxLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _notifier.removeListener(_listener);
    _notifier.dispose();
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _handleRefresh() async {
    await _notifier.refresh();
    await _openRecentSearches();
  }

  void _onQueryChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      _notifier.search(value);
    });
    setState(() {});
  }

  Future<void> _saveRecentSearch(String query) async {
    final normalized = query.trim();
    if (normalized.isEmpty || _recentSearchesBox == null) return;

    final existing = _recentSearchesBox!.values.where((item) => item != normalized).toList();
    final updated = [...existing, normalized];
    while (updated.length > _maxRecentSearches) {
      updated.removeAt(0);
    }

    await _recentSearchesBox!.clear();
    await _recentSearchesBox!.addAll(updated);

    if (!mounted) return;
    setState(() {
      _recentSearches = updated.reversed.toList();
    });
  }

  List<String> _buildSuggestions() {
    final query = _controller.text.trim().toLowerCase();
    final suggestions = <String>{};

    if (query.isEmpty) return const [];

    for (final vendor in _mockSearchVendors) {
      if (vendor.name.toLowerCase().contains(query)) {
        suggestions.add(vendor.name);
      }
      if (vendor.category.toLowerCase().contains(query)) {
        suggestions.add(vendor.category);
      }
      if (vendor.city.toLowerCase().contains(query)) {
        suggestions.add(vendor.city);
      }
    }

    return suggestions.take(6).toList();
  }

  @override
  Widget build(BuildContext context) {
    final state = _notifier.state;
    final suggestions = _buildSuggestions();

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        titleSpacing: 0,
        title: Padding(
          padding: const EdgeInsets.only(right: 16),
          child: TextField(
            controller: _controller,
            focusNode: _focusNode,
            autofocus: true,
            textInputAction: TextInputAction.search,
            onChanged: _onQueryChanged,
            onSubmitted: (value) async {
              await HapticFeedback.lightImpact();
              await _saveRecentSearch(value);
              await _notifier.search(value);
            },
            decoration: InputDecoration(
              hintText: 'Search Hyderabad wedding vendors',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _controller.text.isEmpty
                  ? null
                  : IconButton(
                      onPressed: () async {
                        await HapticFeedback.lightImpact();
                        _controller.clear();
                        _onQueryChanged('');
                      },
                      icon: const Icon(Icons.close),
                    ),
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        color: AppColors.brand,
        onRefresh: _handleRefresh,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (suggestions.isNotEmpty) ...[
                      Text(
                        'Suggestions',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: suggestions
                            .map(
                              (suggestion) => ActionChip(
                                backgroundColor: AppColors.brandLight,
                                label: Text(suggestion),
                                onPressed: () async {
                                  await HapticFeedback.lightImpact();
                                  _controller.text = suggestion;
                                  _controller.selection = TextSelection.fromPosition(
                                    TextPosition(offset: suggestion.length),
                                  );
                                  await _saveRecentSearch(suggestion);
                                  await _notifier.search(suggestion);
                                },
                              ),
                            )
                            .toList(),
                      ),
                      const SizedBox(height: 20),
                    ],
                    Text(
                      'Category',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 42,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _searchCategories.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (context, index) {
                          final category = _searchCategories[index];
                          final selected = state.selectedCategory == category;
                          return ChoiceChip(
                            label: Text(category),
                            selected: selected,
                            selectedColor: AppColors.brand,
                            labelStyle: TextStyle(
                              color: selected ? Colors.white : AppColors.textPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                            onSelected: (_) async {
                              await HapticFeedback.lightImpact();
                              await _notifier.setCategory(category);
                            },
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'City',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 42,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _searchCities.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (context, index) {
                          final city = _searchCities[index];
                          final selected = state.selectedCity == city;
                          return ChoiceChip(
                            label: Text(city),
                            selected: selected,
                            selectedColor: AppColors.gold,
                            labelStyle: TextStyle(
                              color: selected ? Colors.white : AppColors.textPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                            onSelected: (_) async {
                              await HapticFeedback.lightImpact();
                              await _notifier.setCity(city);
                            },
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 20),
                    if (_isBoxLoading)
                      const SizedBox.shrink()
                    else if (_boxError != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 20),
                        child: ErrorStateWidget(
                          message: _boxError!,
                          onRetry: _openRecentSearches,
                        ),
                      )
                    else if (_recentSearches.isNotEmpty) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Recent searches',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          TextButton(
                            onPressed: () async {
                              await HapticFeedback.lightImpact();
                              await _recentSearchesBox?.clear();
                              if (!mounted) return;
                              setState(() {
                                _recentSearches = const [];
                              });
                            },
                            child: const Text('Clear'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _recentSearches
                            .map(
                              (item) => InputChip(
                                label: Text(item),
                                avatar: const Icon(Icons.history, size: 18),
                                onPressed: () async {
                                  await HapticFeedback.lightImpact();
                                  _controller.text = item;
                                  _controller.selection = TextSelection.fromPosition(
                                    TextPosition(offset: item.length),
                                  );
                                  await _notifier.search(item);
                                },
                              ),
                            )
                            .toList(),
                      ),
                      const SizedBox(height: 20),
                    ],
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          state.query.trim().isEmpty ? 'Popular picks' : 'Search results',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        Text(
                          '${state.results.length} found',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.textSecondary,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),
            if (state.isLoading)
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: const _SearchCardSkeleton(),
                    ),
                    childCount: 6,
                  ),
                ),
              )
            else if (state.errorMessage != null)
              SliverFillRemaining(
                hasScrollBody: false,
                child: ErrorStateWidget(
                  message: state.errorMessage!,
                  onRetry: _handleRefresh,
                ),
              )
            else if (state.results.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: EmptyStateWidget(
                  icon: Icons.travel_explore_rounded,
                  title: 'No vendors found',
                  message:
                      'Try searching for venues, catering, mehendi, or Hyderabad photography teams.',
                  actionLabel: 'Clear filters',
                  onAction: () async {
                    await HapticFeedback.lightImpact();
                    _controller.clear();
                    await _notifier.setCategory('All');
                    await _notifier.setCity('All');
                    await _notifier.search('');
                  },
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final vendor = state.results[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _SearchResultCard(
                          vendor: vendor,
                          onTap: () async {
                            await HapticFeedback.lightImpact();
                            await _saveRecentSearch(vendor.name);
                            if (!context.mounted) return;
                            context.go('/vendors/${vendor.id}');
                          },
                        ),
                      );
                    },
                    childCount: state.results.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _SearchResultCard extends StatelessWidget {
  final SearchVendor vendor;
  final VoidCallback onTap;

  const _SearchResultCard({
    required this.vendor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Ink(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: CachedNetworkImage(
                  imageUrl: vendor.imageUrl,
                  width: 96,
                  height: 96,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    color: AppColors.brandLight,
                    alignment: Alignment.center,
                    child: const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                  errorWidget: (context, url, error) => Container(
                    color: AppColors.brandLight,
                    alignment: Alignment.center,
                    child: const Icon(Icons.image_not_supported_outlined),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            vendor.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                        ),
                        if (vendor.verified)
                          const Icon(
                            Icons.verified_rounded,
                            color: AppColors.success,
                            size: 18,
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
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
                            vendor.category,
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
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.star_rounded, size: 14, color: AppColors.gold),
                              const SizedBox(width: 4),
                              Text(
                                vendor.rating.toStringAsFixed(1),
                                style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      vendor.price,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_outlined,
                          size: 16,
                          color: AppColors.textSecondary,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          vendor.city,
                          style: const TextStyle(color: AppColors.textSecondary),
                        ),
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

class _SearchCardSkeleton extends StatelessWidget {
  const _SearchCardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(width: double.infinity, height: 18, color: Colors.white),
                  const SizedBox(height: 10),
                  Container(width: 110, height: 14, color: Colors.white),
                  const SizedBox(height: 10),
                  Container(width: 80, height: 14, color: Colors.white),
                  const SizedBox(height: 10),
                  Container(width: 120, height: 14, color: Colors.white),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

const _searchCategories = <String>[
  'All',
  'Venue',
  'Photography',
  'Catering',
  'Decor',
  'Makeup',
  'Music',
  'Videography',
  'Mehendi',
  'Bridal Wear',
  'Band/Music',
];

const _searchCities = <String>['All', 'Hyderabad', 'Chennai'];

const _mockSearchVendors = <SearchVendor>[
  SearchVendor(
    id: 'v1',
    name: 'Royal Grand Palace',
    category: 'Venue',
    city: 'Hyderabad',
    rating: 4.9,
    price: '₹5L+ onwards',
    imageUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80',
    verified: true,
  ),
  SearchVendor(
    id: 'v2',
    name: 'Srikanth Photography',
    category: 'Photography',
    city: 'Hyderabad',
    rating: 4.8,
    price: '₹80K+ onwards',
    imageUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80',
    verified: true,
  ),
  SearchVendor(
    id: 'v3',
    name: 'Flavours Catering',
    category: 'Catering',
    city: 'Hyderabad',
    rating: 4.7,
    price: '₹800/plate',
    imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80',
    verified: true,
  ),
  SearchVendor(
    id: 'v4',
    name: 'Blooms & Dreams',
    category: 'Decor',
    city: 'Hyderabad',
    rating: 4.9,
    price: '₹1.5L+ onwards',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
    verified: true,
  ),
  SearchVendor(
    id: 'v5',
    name: 'Glow Bridal Studio',
    category: 'Makeup',
    city: 'Hyderabad',
    rating: 4.6,
    price: '₹25K+ onwards',
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
    verified: true,
  ),
  SearchVendor(
    id: 'v6',
    name: 'Beats & Bass DJ',
    category: 'Music',
    city: 'Hyderabad',
    rating: 4.5,
    price: '₹35K+ onwards',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
    verified: false,
  ),
  SearchVendor(
    id: 'v7',
    name: 'Cinematic Reels',
    category: 'Videography',
    city: 'Hyderabad',
    rating: 4.8,
    price: '₹60K+ onwards',
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80',
    verified: true,
  ),
  SearchVendor(
    id: 'v8',
    name: 'Mehndi by Fatima',
    category: 'Mehendi',
    city: 'Hyderabad',
    rating: 4.9,
    price: '₹8K+ onwards',
    imageUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&q=80',
    verified: true,
  ),
  SearchVendor(
    id: 'v9',
    name: 'Silk Route Attire',
    category: 'Bridal Wear',
    city: 'Hyderabad',
    rating: 4.7,
    price: '₹50K+ onwards',
    imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=80',
    verified: true,
  ),
  SearchVendor(
    id: 'v10',
    name: 'Golden Bells Band',
    category: 'Band/Music',
    city: 'Chennai',
    rating: 4.6,
    price: '₹40K+ onwards',
    imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80',
    verified: false,
  ),
];
