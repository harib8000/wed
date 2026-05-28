import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

// ─── Mock vendor data ──────────────────────────────────────
class _Vendor {
  final String id, name, category, city, price, image;
  final double rating;
  final int reviews;
  final bool verified;
  const _Vendor({required this.id, required this.name, required this.category, required this.city, required this.rating, required this.reviews, required this.price, required this.image, this.verified = false});
}

const _allVendors = [
  _Vendor(id: 'v1', name: 'Royal Grand Palace', category: 'Venue', city: 'Hyderabad', rating: 4.9, reviews: 247, price: '₹5L onwards', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&q=80', verified: true),
  _Vendor(id: 'v2', name: 'Srikanth Photography', category: 'Photography', city: 'Hyderabad', rating: 4.8, reviews: 189, price: '₹80K onwards', image: 'https://images.unsplash.com/photo-1537907690979-13c0f6a4c7f4?w=400&q=80', verified: true),
  _Vendor(id: 'v3', name: 'Flavours Catering', category: 'Catering', city: 'Hyderabad', rating: 4.7, reviews: 312, price: '₹800/plate', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=400&q=80', verified: true),
  _Vendor(id: 'v4', name: 'Blooms & Dreams', category: 'Decor', city: 'Hyderabad', rating: 4.9, reviews: 156, price: '₹1.5L onwards', image: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=400&q=80'),
  _Vendor(id: 'v5', name: 'Glow Bridal Studio', category: 'Makeup', city: 'Hyderabad', rating: 4.6, reviews: 98, price: '₹25K onwards', image: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=400&q=80'),
  _Vendor(id: 'v6', name: 'Beats & Bass DJ', category: 'Music', city: 'Hyderabad', rating: 4.5, reviews: 74, price: '₹35K onwards', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80'),
  _Vendor(id: 'v7', name: 'Cinematic Reels', category: 'Videography', city: 'Hyderabad', rating: 4.8, reviews: 112, price: '₹60K onwards', image: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=400&q=80', verified: true),
  _Vendor(id: 'v8', name: 'The Grand Mahal', category: 'Venue', city: 'Bangalore', rating: 4.7, reviews: 203, price: '₹8L onwards', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&q=80'),
];

const _filterCategories = ['All', 'Venue', 'Photography', 'Catering', 'Decor', 'Makeup', 'Music', 'Videography'];
const _sortOptions = ['Relevance', 'Rating', 'Price: Low to High', 'Price: High to Low', 'Most Reviewed'];
const _cities = ['All Cities', 'Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai'];

class VendorsScreen extends StatefulWidget {
  final String? initialCategory;
  const VendorsScreen({super.key, this.initialCategory});

  @override
  State<VendorsScreen> createState() => _VendorsScreenState();
}

class _VendorsScreenState extends State<VendorsScreen> {
  late String _selectedCategory;
  String _selectedSort = 'Relevance';
  String _selectedCity = 'All Cities';
  RangeValues _priceRange = const RangeValues(0, 10);   // in lakhs
  double _minRating = 0;
  final _searchController = TextEditingController();
  String _searchQuery = '';

  bool get _hasActiveFilters =>
      _selectedCity != 'All Cities' || _priceRange != const RangeValues(0, 10) || _minRating > 0;

  @override
  void initState() {
    super.initState();
    _selectedCategory = _mapCategory(widget.initialCategory);
  }

  String _mapCategory(String? raw) {
    if (raw == null || raw.isEmpty) return 'All';
    final mapped = {
      'venue': 'Venue', 'photography': 'Photography', 'catering': 'Catering',
      'decor': 'Decor', 'makeup': 'Makeup', 'music': 'Music', 'videography': 'Videography',
    };
    return mapped[raw.toLowerCase()] ?? 'All';
  }

  List<_Vendor> get _filteredVendors {
    var list = _allVendors.toList();
    if (_selectedCategory != 'All') {
      list = list.where((v) => v.category == _selectedCategory).toList();
    }
    if (_selectedCity != 'All Cities') {
      list = list.where((v) => v.city == _selectedCity).toList();
    }
    if (_minRating > 0) {
      list = list.where((v) => v.rating >= _minRating).toList();
    }
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      list = list.where((v) => v.name.toLowerCase().contains(q) || v.category.toLowerCase().contains(q) || v.city.toLowerCase().contains(q)).toList();
    }
    switch (_selectedSort) {
      case 'Rating':
        list.sort((a, b) => b.rating.compareTo(a.rating));
        break;
      case 'Most Reviewed':
        list.sort((a, b) => b.reviews.compareTo(a.reviews));
        break;
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final vendors = _filteredVendors;

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
                  right: 8, top: 8,
                  child: Container(
                    width: 8, height: 8,
                    decoration: BoxDecoration(color: AppColors.brand, shape: BoxShape.circle),
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
          // ─── Search bar ────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: TextField(
              controller: _searchController,
              onChanged: (v) => setState(() => _searchQuery = v),
              decoration: InputDecoration(
                hintText: 'Search vendors...',
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(icon: const Icon(Icons.close, size: 18), onPressed: () { _searchController.clear(); setState(() => _searchQuery = ''); })
                    : null,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.border)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.border)),
              ),
            ),
          ),

          // ─── Category chips ────
          SizedBox(
            height: 50,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: _filterCategories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final cat = _filterCategories[i];
                final selected = _selectedCategory == cat;
                return ChoiceChip(
                  label: Text(cat, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: selected ? Colors.white : AppColors.textPrimary)),
                  selected: selected,
                  selectedColor: AppColors.brand,
                  backgroundColor: Colors.grey.shade100,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  onSelected: (_) => setState(() => _selectedCategory = cat),
                );
              },
            ),
          ),

          // ─── Result count + sort label ─
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('${vendors.length} vendors found', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                GestureDetector(
                  onTap: () => _showSortSheet(context),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.sort, size: 14, color: AppColors.textMuted),
                      const SizedBox(width: 4),
                      Text(_selectedSort, style: TextStyle(color: AppColors.brand, fontSize: 12, fontWeight: FontWeight.w500)),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ─── Vendor list ───────
          Expanded(
            child: vendors.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.search_off, size: 64, color: AppColors.border),
                        const SizedBox(height: 16),
                        Text('No vendors found', style: TextStyle(color: AppColors.textMuted, fontSize: 16)),
                        const SizedBox(height: 8),
                        TextButton(onPressed: _clearAllFilters, child: const Text('Clear Filters')),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                    itemCount: vendors.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, i) => _VendorListCard(vendor: vendors[i]),
                  ),
          ),
        ],
      ),
    );
  }

  void _clearAllFilters() {
    setState(() {
      _selectedCategory = 'All';
      _selectedCity = 'All Cities';
      _priceRange = const RangeValues(0, 10);
      _minRating = 0;
      _searchController.clear();
      _searchQuery = '';
    });
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
            ..._sortOptions.map((s) => ListTile(
              title: Text(s),
              trailing: _selectedSort == s ? Icon(Icons.check, color: AppColors.brand) : null,
              onTap: () { setState(() => _selectedSort = s); Navigator.pop(context); },
            )),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  void _showFilterSheet(BuildContext context) {
    // Use local state inside the sheet so we can preview before applying
    String city = _selectedCity;
    RangeValues price = _priceRange;
    double rating = _minRating;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (sheetCtx) => StatefulBuilder(
        builder: (ctx, setSheetState) => DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.65,
          maxChildSize: 0.85,
          minChildSize: 0.4,
          builder: (_, scrollCtrl) => Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
            child: ListView(
              controller: scrollCtrl,
              children: [
                // Handle bar
                Center(
                  child: Container(
                    margin: const EdgeInsets.only(top: 12, bottom: 8),
                    width: 40, height: 4,
                    decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
                  ),
                ),
                // Title row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Filters', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    TextButton(
                      onPressed: () {
                        setSheetState(() {
                          city = 'All Cities';
                          price = const RangeValues(0, 10);
                          rating = 0;
                        });
                      },
                      child: Text('Reset', style: TextStyle(color: AppColors.brand)),
                    ),
                  ],
                ),
                const Divider(),

                // ─── City ────────────────────────
                const Text('City', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8, runSpacing: 8,
                  children: _cities.map((c) {
                    final sel = city == c;
                    return ChoiceChip(
                      label: Text(c, style: TextStyle(fontSize: 12, color: sel ? Colors.white : AppColors.textPrimary)),
                      selected: sel,
                      selectedColor: AppColors.brand,
                      backgroundColor: Colors.grey.shade100,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      onSelected: (_) => setSheetState(() => city = c),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 20),

                // ─── Price range ──────────────────
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Budget', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                    Text(
                      price.start == 0 && price.end >= 10
                          ? 'Any budget'
                          : '₹${price.start.toStringAsFixed(0)}L – ₹${price.end >= 10 ? "10L+" : "${price.end.toStringAsFixed(0)}L"}',
                      style: TextStyle(color: AppColors.brand, fontSize: 13),
                    ),
                  ],
                ),
                RangeSlider(
                  values: price,
                  min: 0, max: 10,
                  divisions: 10,
                  activeColor: AppColors.brand,
                  labels: RangeLabels(
                    '₹${price.start.toStringAsFixed(0)}L',
                    price.end >= 10 ? '₹10L+' : '₹${price.end.toStringAsFixed(0)}L',
                  ),
                  onChanged: (v) => setSheetState(() => price = v),
                ),
                const SizedBox(height: 10),

                // ─── Min rating ───────────────────
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Minimum Rating', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
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
                  min: 0, max: 5,
                  divisions: 10,
                  activeColor: AppColors.brand,
                  label: rating == 0 ? 'Any' : '${rating.toStringAsFixed(1)}+',
                  onChanged: (v) => setSheetState(() => rating = v),
                ),
                const SizedBox(height: 20),

                // ─── Apply button ─────────────────
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.brand,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () {
                      setState(() {
                        _selectedCity = city;
                        _priceRange = price;
                        _minRating = rating;
                      });
                      Navigator.pop(context);
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

// ─── Vendor List Card ──────────────────────────────────────
class _VendorListCard extends StatelessWidget {
  final _Vendor vendor;
  const _VendorListCard({required this.vendor});

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
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              child: Stack(
                children: [
                  CachedNetworkImage(imageUrl: vendor.image, height: 160, width: double.infinity, fit: BoxFit.cover),
                  if (vendor.verified)
                    Positioned(
                      top: 12, left: 12,
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
                    top: 12, right: 12,
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.9), shape: BoxShape.circle),
                      child: const Icon(Icons.favorite_border, size: 18, color: Colors.grey),
                    ),
                  ),
                ],
              ),
            ),
            // Info
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(vendor.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: AppColors.brandLight, borderRadius: BorderRadius.circular(6)),
                        child: Text(vendor.category, style: TextStyle(color: AppColors.brand, fontSize: 11, fontWeight: FontWeight.w500)),
                      ),
                      const SizedBox(width: 8),
                      Icon(Icons.location_on, size: 14, color: AppColors.textMuted),
                      Text(vendor.city, style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
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
                          Text('${vendor.rating}', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                          Text(' (${vendor.reviews} reviews)', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                        ],
                      ),
                      Text(vendor.price, style: TextStyle(color: AppColors.brand, fontWeight: FontWeight.bold, fontSize: 14)),
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
