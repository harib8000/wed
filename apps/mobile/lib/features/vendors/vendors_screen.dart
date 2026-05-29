import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/theme.dart';
import '../../models/vendor.dart';
import '../../providers/vendor_provider.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/error_state_widget.dart';

const _sortOptions = ['relevance', 'rating', 'price_asc', 'price_desc'];
const _sortLabels = {
  'relevance': 'Relevance',
  'rating': 'Rating',
  'price_asc': 'Price: Low to High',
  'price_desc': 'Price: High to Low',
};
const _cities = ['All Cities', 'Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai'];
const _eventTypes = ['All Events', 'Wedding', 'Engagement', 'Haldi', 'Sangeet'];

class VendorsScreen extends ConsumerStatefulWidget {
  final String? initialCategory;
  const VendorsScreen({super.key, this.initialCategory});

  @override
  ConsumerState<VendorsScreen> createState() => _VendorsScreenState();
}

class _VendorsScreenState extends ConsumerState<VendorsScreen> {
  late String _selectedCategory;
  String _selectedSort = 'relevance';
  String _selectedCity = 'All Cities';
  String _selectedEventType = 'All Events';
  RangeValues _priceRange = const RangeValues(0, 10);
  double _minRating = 0;
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();
  final Set<String> _compareIds = <String>{};
  Timer? _debounce;
  int _visibleCount = 8;

  bool get _hasActiveFilters =>
      _selectedCategory != 'All' ||
      _selectedCity != 'All Cities' ||
      _selectedEventType != 'All Events' ||
      _priceRange != const RangeValues(0, 10) ||
      _minRating > 0 ||
      _searchController.text.trim().isNotEmpty;

  @override
  void initState() {
    super.initState();
    _selectedCategory = _mapCategory(widget.initialCategory);
    _scrollController.addListener(_handleScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) => _runSearch());
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _handleScroll() {
    if (!_scrollController.hasClients) return;
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 240) {
      setState(() => _visibleCount += 6);
    }
  }

  String _mapCategory(String? raw) {
    if (raw == null || raw.isEmpty) return 'All';
    final normalized = raw.toUpperCase();
    final known = <String>{'VENUE', 'PHOTOGRAPHY', 'CATERING', 'DECORATION', 'MAKEUP', 'MUSIC', 'VIDEOGRAPHY'};
    return known.contains(normalized) ? normalized : 'All';
  }

  void _scheduleSearch() {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), _runSearch);
  }

  Future<void> _runSearch() async {
    setState(() => _visibleCount = 8);
    await ref.read(vendorSearchProvider.notifier).search(
          VendorFilter(
            query: _searchController.text.trim().isEmpty ? null : _searchController.text.trim(),
            category: _selectedCategory == 'All' ? null : _selectedCategory,
            city: _selectedCity == 'All Cities' ? null : _selectedCity,
            sortBy: _selectedSort,
          ),
        );
  }

  void _clearAllFilters() {
    setState(() {
      _selectedCategory = 'All';
      _selectedCity = 'All Cities';
      _selectedEventType = 'All Events';
      _priceRange = const RangeValues(0, 10);
      _minRating = 0;
      _compareIds.clear();
      _searchController.clear();
    });
    _runSearch();
  }

  List<Vendor> _applyClientSideFilters(List<Vendor> vendors) {
    var filtered = vendors.where((vendor) {
      final priceLakhs = ((vendor.startingPricePaise ?? 0) / 10000000);
      final priceMatches = vendor.startingPricePaise == null || (priceLakhs >= _priceRange.start && priceLakhs <= _priceRange.end + 0.001);
      final ratingMatches = vendor.avgRating >= _minRating;
      final cityMatches = _selectedCity == 'All Cities' || vendor.city == _selectedCity;
      final eventMatches = _selectedEventType == 'All Events' || vendor.tagline?.toLowerCase().contains(_selectedEventType.toLowerCase()) == true || vendor.description?.toLowerCase().contains(_selectedEventType.toLowerCase()) == true;
      return priceMatches && ratingMatches && cityMatches && eventMatches;
    }).toList();

    switch (_selectedSort) {
      case 'rating':
        filtered.sort((a, b) => b.avgRating.compareTo(a.avgRating));
        break;
      case 'price_asc':
        filtered.sort((a, b) => (a.startingPricePaise ?? 1 << 30).compareTo(b.startingPricePaise ?? 1 << 30));
        break;
      case 'price_desc':
        filtered.sort((a, b) => (b.startingPricePaise ?? 0).compareTo(a.startingPricePaise ?? 0));
        break;
    }
    return filtered;
  }

  void _toggleCompare(Vendor vendor) {
    HapticFeedback.lightImpact();
    final alreadySelected = _compareIds.contains(vendor.id);
    final isAtLimit = !alreadySelected && _compareIds.length >= 3;
    if (isAtLimit) {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(const SnackBar(content: Text('You can compare up to 3 vendors at a time.')));
      return;
    }
    setState(() {
      if (alreadySelected) {
        _compareIds.remove(vendor.id);
      } else {
        _compareIds.add(vendor.id);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final vendorsAsync = ref.watch(vendorSearchProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Explore Vendors'),
        actions: [
          Stack(
            children: [
              IconButton(
                tooltip: 'Filters',
                icon: const Icon(Icons.tune),
                onPressed: () => _showFilterSheet(context),
              ),
              if (_hasActiveFilters)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(color: AppColors.brand, shape: BoxShape.circle),
                  ),
                ),
            ],
          ),
          IconButton(
            tooltip: 'Sort',
            icon: const Icon(Icons.sort),
            onPressed: () => _showSortSheet(context),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: TextField(
              controller: _searchController,
              onChanged: (_) {
                setState(() {});
                _scheduleSearch();
              },
              decoration: InputDecoration(
                hintText: 'Search vendors, categories, locations...',
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.close, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          _runSearch();
                          setState(() {});
                        },
                      )
                    : null,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
              ),
            ),
          ),
          SizedBox(
            height: 50,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: _categoryLabels.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final entry = _categoryLabels.entries.elementAt(index);
                final selected = _selectedCategory == entry.key;
                return ChoiceChip(
                  label: Text(entry.value, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: selected ? Colors.white : AppColors.textPrimary)),
                  selected: selected,
                  selectedColor: AppColors.brand,
                  backgroundColor: Colors.grey.shade100,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  onSelected: (_) {
                    setState(() => _selectedCategory = entry.key);
                    _runSearch();
                  },
                );
              },
            ),
          ),
          if (_compareIds.isNotEmpty)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(color: AppColors.brandLight, borderRadius: BorderRadius.circular(14)),
              child: Row(
                children: [
                  const Icon(Icons.compare_arrows_rounded, color: AppColors.brand),
                  const SizedBox(width: 10),
                  Expanded(child: Text('${_compareIds.length} vendor${_compareIds.length == 1 ? '' : 's'} selected for compare', style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.brand))),
                  TextButton(
                    onPressed: () => setState(_compareIds.clear),
                    child: const Text('Clear'),
                  ),
                ],
              ),
            ),
          Expanded(
            child: vendorsAsync.when(
              loading: () => _VendorsLoadingList(scrollController: _scrollController),
              error: (error, _) => ErrorStateWidget(
                message: 'Could not load vendors right now.',
                onRetry: _runSearch,
              ),
              data: (vendors) {
                final filtered = _applyClientSideFilters(vendors);
                final visible = filtered.take(_visibleCount).toList();
                if (filtered.isEmpty) {
                  return EmptyStateWidget(
                    icon: Icons.search_off_rounded,
                    title: 'No vendors found',
                    message: 'Try adjusting your category, city, or budget filters to discover more options.',
                    actionLabel: 'Clear Filters',
                    onAction: _clearAllFilters,
                  );
                }
                return RefreshIndicator(
                  onRefresh: _runSearch,
                  child: ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                    itemCount: visible.length + 2,
                    itemBuilder: (context, index) {
                      if (index == 0) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('${filtered.length} vendors found', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                              GestureDetector(
                                onTap: () => _showSortSheet(context),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.sort, size: 14, color: AppColors.textMuted),
                                    const SizedBox(width: 4),
                                    Text(_sortLabels[_selectedSort]!, style: const TextStyle(color: AppColors.brand, fontSize: 12, fontWeight: FontWeight.w500)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      }
                      if (index == visible.length + 1) {
                        return filtered.length > visible.length
                            ? Padding(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                child: Center(
                                  child: OutlinedButton.icon(
                                    onPressed: () => setState(() => _visibleCount += 6),
                                    icon: const Icon(Icons.expand_more),
                                    label: const Text('Load more'),
                                  ),
                                ),
                              )
                            : const SizedBox(height: 12);
                      }
                      final vendor = visible[index - 1];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _VendorListCard(
                          vendor: vendor,
                          compareSelected: _compareIds.contains(vendor.id),
                          onCompareToggle: () => _toggleCompare(vendor),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showSortSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('Sort By', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ),
            ..._sortOptions.map(
              (option) => ListTile(
                title: Text(_sortLabels[option]!),
                trailing: _selectedSort == option ? const Icon(Icons.check, color: AppColors.brand) : null,
                onTap: () {
                  setState(() => _selectedSort = option);
                  Navigator.pop(context);
                  _runSearch();
                },
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  void _showFilterSheet(BuildContext context) {
    String city = _selectedCity;
    String eventType = _selectedEventType;
    RangeValues price = _priceRange;
    double rating = _minRating;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setSheetState) => DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.7,
          maxChildSize: 0.9,
          minChildSize: 0.45,
          builder: (_, scrollController) => Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
            child: ListView(
              controller: scrollController,
              children: [
                Center(
                  child: Container(
                    margin: const EdgeInsets.only(top: 12, bottom: 8),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Filters', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    TextButton(
                      onPressed: () {
                        setSheetState(() {
                          city = 'All Cities';
                          eventType = 'All Events';
                          price = const RangeValues(0, 10);
                          rating = 0;
                        });
                      },
                      child: const Text('Reset', style: TextStyle(color: AppColors.brand)),
                    ),
                  ],
                ),
                const Divider(),
                const Text('City', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _cities.map((value) {
                    final selected = city == value;
                    return ChoiceChip(
                      label: Text(value, style: TextStyle(fontSize: 12, color: selected ? Colors.white : AppColors.textPrimary)),
                      selected: selected,
                      selectedColor: AppColors.brand,
                      backgroundColor: Colors.grey.shade100,
                      onSelected: (_) => setSheetState(() => city = value),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 20),
                const Text('Event type', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _eventTypes.map((value) {
                    final selected = eventType == value;
                    return ChoiceChip(
                      label: Text(value, style: TextStyle(fontSize: 12, color: selected ? Colors.white : AppColors.textPrimary)),
                      selected: selected,
                      selectedColor: AppColors.brand,
                      backgroundColor: Colors.grey.shade100,
                      onSelected: (_) => setSheetState(() => eventType = value),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Budget', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                    Text(
                      price.start == 0 && price.end >= 10 ? 'Any budget' : '₹${price.start.toStringAsFixed(0)}L – ₹${price.end >= 10 ? '10L+' : '${price.end.toStringAsFixed(0)}L'}',
                      style: const TextStyle(color: AppColors.brand, fontSize: 13),
                    ),
                  ],
                ),
                RangeSlider(
                  values: price,
                  min: 0,
                  max: 10,
                  divisions: 10,
                  activeColor: AppColors.brand,
                  labels: RangeLabels('₹${price.start.toStringAsFixed(0)}L', price.end >= 10 ? '₹10L+' : '₹${price.end.toStringAsFixed(0)}L'),
                  onChanged: (value) => setSheetState(() => price = value),
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Minimum rating', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                    if (rating > 0)
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star, color: AppColors.gold, size: 16),
                          Text(' ${rating.toStringAsFixed(1)}+', style: const TextStyle(fontSize: 13)),
                        ],
                      ),
                  ],
                ),
                Slider(
                  value: rating,
                  min: 0,
                  max: 5,
                  divisions: 10,
                  activeColor: AppColors.brand,
                  label: rating == 0 ? 'Any' : '${rating.toStringAsFixed(1)}+',
                  onChanged: (value) => setSheetState(() => rating = value),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.brand, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    onPressed: () {
                      setState(() {
                        _selectedCity = city;
                        _selectedEventType = eventType;
                        _priceRange = price;
                        _minRating = rating;
                      });
                      Navigator.pop(context);
                      _runSearch();
                    },
                    child: const Text('Apply Filters', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _VendorListCard extends ConsumerWidget {
  final Vendor vendor;
  final bool compareSelected;
  final VoidCallback onCompareToggle;
  const _VendorListCard({required this.vendor, required this.compareSelected, required this.onCompareToggle});

  String _priceLabel(int? paise) {
    if (paise == null) return 'Custom pricing';
    final rupees = paise ~/ 100;
    return rupees >= 100000 ? '₹${(rupees / 100000).toStringAsFixed(1)}L onwards' : '₹${(rupees / 1000).toStringAsFixed(0)}K onwards';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isWishlisted = ref.watch(wishlistProvider.select((items) => items.any((item) => item.vendorId == vendor.id)));

    return GestureDetector(
      onTap: () => context.push('/vendors/${vendor.id}'),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: compareSelected ? AppColors.brand : AppColors.border, width: compareSelected ? 1.5 : 0.5),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              child: Stack(
                children: [
                  CachedNetworkImage(imageUrl: vendor.displayImage, height: 170, width: double.infinity, fit: BoxFit.cover),
                  if (vendor.verified)
                    Positioned(
                      top: 12,
                      left: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: AppColors.brand, borderRadius: BorderRadius.circular(8)),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.verified, color: Colors.white, size: 12),
                            SizedBox(width: 4),
                            Text('Verified', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                    ),
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Row(
                      children: [
                        GestureDetector(
                          onTap: () async {
                            HapticFeedback.lightImpact();
                            await ref.read(wishlistProvider.notifier).toggle(vendor);
                          },
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: Colors.white.withOpacity(0.92), shape: BoxShape.circle),
                            child: Icon(isWishlisted ? Icons.favorite : Icons.favorite_border, size: 18, color: isWishlisted ? AppColors.error : Colors.grey),
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: onCompareToggle,
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: compareSelected ? AppColors.brand : Colors.white.withOpacity(0.92), shape: BoxShape.circle),
                            child: Icon(Icons.compare_arrows_rounded, size: 18, color: compareSelected ? Colors.white : AppColors.textMuted),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(vendor.businessName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: AppColors.brandLight, borderRadius: BorderRadius.circular(6)),
                        child: Text(vendor.category, style: const TextStyle(color: AppColors.brand, fontSize: 11, fontWeight: FontWeight.w500)),
                      ),
                      const SizedBox(width: 8),
                      const Icon(Icons.location_on, size: 14, color: AppColors.textMuted),
                      Expanded(child: Text(vendor.city, style: const TextStyle(color: AppColors.textMuted, fontSize: 12), overflow: TextOverflow.ellipsis)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.star, color: AppColors.gold, size: 16),
                          const SizedBox(width: 2),
                          Text(vendor.avgRating.toStringAsFixed(1), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                          Text(' (${vendor.reviewCount} reviews)', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                        ],
                      ),
                      Text(_priceLabel(vendor.startingPricePaise), style: const TextStyle(color: AppColors.brand, fontWeight: FontWeight.bold, fontSize: 14)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: onCompareToggle,
                          icon: const Icon(Icons.compare_arrows_rounded, size: 16),
                          label: Text(compareSelected ? 'Selected' : 'Compare'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => context.push('/vendors/${vendor.id}'),
                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.brand, foregroundColor: Colors.white),
                          child: const Text('View Details'),
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

class _VendorsLoadingList extends StatelessWidget {
  final ScrollController scrollController;
  const _VendorsLoadingList({required this.scrollController});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      controller: scrollController,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      itemCount: 6,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) => Shimmer.fromColors(
        baseColor: Colors.grey.shade200,
        highlightColor: Colors.grey.shade100,
        child: Container(
          height: 300,
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18)),
        ),
      ),
    );
  }
}

const _categoryLabels = {
  'All': 'All',
  'VENUE': 'Venue',
  'PHOTOGRAPHY': 'Photography',
  'CATERING': 'Catering',
  'DECORATION': 'Decor',
  'MAKEUP': 'Makeup',
  'MUSIC': 'Music',
  'VIDEOGRAPHY': 'Videography',
};
