import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';
import '../../core/api_client.dart';
import '../../providers/vendor_provider.dart';

// ─── Write Review Screen ────────────────────────────────────
class WriteReviewScreen extends ConsumerStatefulWidget {
  final String vendorId;
  final String? bookingId;

  const WriteReviewScreen({super.key, required this.vendorId, this.bookingId});

  @override
  ConsumerState<WriteReviewScreen> createState() => _WriteReviewScreenState();
}

class _WriteReviewScreenState extends ConsumerState<WriteReviewScreen> {
  double _overallRating = 0;
  double _qualityRating = 0;
  double _valueRating = 0;
  double _professionalismRating = 0;
  final _titleCtrl = TextEditingController();
  final _bodyCtrl = TextEditingController();
  bool _isSubmitting = false;
  String _error = '';
  bool _submitted = false;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _bodyCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_overallRating == 0) {
      setState(() => _error = 'Please rate your experience');
      return;
    }
    if (_bodyCtrl.text.trim().length < 20) {
      setState(() => _error = 'Please write at least 20 characters');
      return;
    }
    setState(() { _error = ''; _isSubmitting = true; });

    try {
      await ApiClient.submitReview({
        'vendorId': widget.vendorId,
        if (widget.bookingId != null) 'bookingId': widget.bookingId,
        'rating': _overallRating,
        'title': _titleCtrl.text.trim(),
        'body': _bodyCtrl.text.trim(),
        'qualityRating': _qualityRating > 0 ? _qualityRating : null,
        'valueRating': _valueRating > 0 ? _valueRating : null,
        'professionalismRating': _professionalismRating > 0 ? _professionalismRating : null,
      });
      setState(() { _submitted = true; _isSubmitting = false; });
    } catch (e) {
      setState(() { _error = 'Could not submit review. Please try again.'; _isSubmitting = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_submitted) return _SuccessView(onDone: () => context.go('/bookings'));

    final vendorAsync = ref.watch(vendorDetailProvider(widget.vendorId));

    return Scaffold(
      appBar: AppBar(title: const Text('Write a Review')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Vendor card
          vendorAsync.when(
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
            data: (v) => _VendorChip(name: v.businessName, category: v.category),
          ),
          const SizedBox(height: 20),

          // Overall rating
          _Section(
            title: 'Overall Experience',
            child: Column(children: [
              const Text('How was your overall experience?', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
              const SizedBox(height: 10),
              _StarRating(rating: _overallRating, size: 48, onRate: (r) => setState(() => _overallRating = r)),
              if (_overallRating > 0) Padding(padding: const EdgeInsets.only(top: 4), child: Text(_ratingLabel(_overallRating), style: TextStyle(color: AppColors.brand, fontWeight: FontWeight.w600))),
            ]),
          ),
          const SizedBox(height: 16),

          // Sub-ratings
          _Section(
            title: 'Detailed Ratings (Optional)',
            child: Column(children: [
              _SubRating(label: 'Quality of Work', rating: _qualityRating, onRate: (r) => setState(() => _qualityRating = r)),
              _SubRating(label: 'Value for Money', rating: _valueRating, onRate: (r) => setState(() => _valueRating = r)),
              _SubRating(label: 'Professionalism', rating: _professionalismRating, onRate: (r) => setState(() => _professionalismRating = r)),
            ]),
          ),
          const SizedBox(height: 16),

          // Review text
          _Section(
            title: 'Your Review',
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              TextField(
                controller: _titleCtrl,
                maxLength: 80,
                decoration: const InputDecoration(labelText: 'Review Title (optional)', hintText: 'e.g. Outstanding service!'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _bodyCtrl,
                maxLines: 5,
                maxLength: 1000,
                decoration: const InputDecoration(
                  labelText: 'Describe your experience',
                  hintText: 'Share details about the quality of service, how they made your day special, and anything that stood out...',
                  alignLabelWithHint: true,
                ),
              ),
            ]),
          ),
          const SizedBox(height: 16),

          // Error
          if (_error.isNotEmpty) Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.red.shade200)),
            child: Row(children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 16),
              const SizedBox(width: 8),
              Expanded(child: Text(_error, style: const TextStyle(color: Colors.red, fontSize: 12))),
            ]),
          ),
          const SizedBox(height: 20),

          // Submit
          SizedBox(width: double.infinity, child: ElevatedButton(
            onPressed: _isSubmitting ? null : _submit,
            child: _isSubmitting ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Submit Review'),
          )),
          const SizedBox(height: 8),
          Center(child: Text('Reviews are public & cannot be edited after submission', style: TextStyle(color: AppColors.textMuted, fontSize: 11))),
          const SizedBox(height: 30),
        ]),
      ),
    );
  }

  String _ratingLabel(double r) {
    if (r >= 5) return 'Excellent!';
    if (r >= 4) return 'Very Good';
    if (r >= 3) return 'Good';
    if (r >= 2) return 'Fair';
    return 'Poor';
  }
}

// ─── Star Rating Widget ─────────────────────────────────────
class _StarRating extends StatelessWidget {
  final double rating;
  final double size;
  final ValueChanged<double>? onRate;
  const _StarRating({required this.rating, this.size = 28, this.onRate});

  @override
  Widget build(BuildContext context) => Row(
    mainAxisAlignment: MainAxisAlignment.center,
    children: List.generate(5, (i) {
      final filled = i < rating.floor();
      final half = !filled && i < rating;
      return GestureDetector(
        onTap: onRate != null ? () => onRate!(i + 1.0) : null,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Icon(filled ? Icons.star : (half ? Icons.star_half : Icons.star_border), color: AppColors.gold, size: size),
        ),
      );
    }),
  );
}

// ─── Sub Rating ─────────────────────────────────────────────
class _SubRating extends StatelessWidget {
  final String label;
  final double rating;
  final ValueChanged<double> onRate;
  const _SubRating({required this.label, required this.rating, required this.onRate});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(children: [
      SizedBox(width: 130, child: Text(label, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary))),
      Row(children: List.generate(5, (i) => GestureDetector(
        onTap: () => onRate(i + 1.0),
        child: Padding(padding: const EdgeInsets.symmetric(horizontal: 2), child: Icon(i < rating ? Icons.star : Icons.star_border, color: AppColors.gold, size: 20)),
      ))),
      const SizedBox(width: 8),
      Text(rating > 0 ? rating.toStringAsFixed(0) : '-', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
    ]),
  );
}

// ─── Section Wrapper ────────────────────────────────────────
class _Section extends StatelessWidget {
  final String title;
  final Widget child;
  const _Section({required this.title, required this.child});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
      const SizedBox(height: 12),
      child,
    ]),
  );
}

// ─── Vendor Chip ────────────────────────────────────────────
class _VendorChip extends StatelessWidget {
  final String name, category;
  const _VendorChip({required this.name, required this.category});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    decoration: BoxDecoration(color: AppColors.brandLight, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.brand.withOpacity(0.3))),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.store_outlined, color: AppColors.brand, size: 16),
      const SizedBox(width: 6),
      Text('$name · $category', style: const TextStyle(color: AppColors.brand, fontWeight: FontWeight.w600, fontSize: 13)),
    ]),
  );
}

// ─── Success View ───────────────────────────────────────────
class _SuccessView extends StatelessWidget {
  final VoidCallback onDone;
  const _SuccessView({required this.onDone});

  @override
  Widget build(BuildContext context) => Scaffold(
    body: Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(width: 88, height: 88, decoration: const BoxDecoration(color: Colors.green, shape: BoxShape.circle), child: const Icon(Icons.check, color: Colors.white, size: 44)),
          const SizedBox(height: 20),
          const Text('Review Submitted!', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 22)),
          const SizedBox(height: 8),
          const Text('Thank you for sharing your experience.\nYour review helps other couples make better decisions.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
          const SizedBox(height: 28),
          ElevatedButton(onPressed: onDone, child: const Text('Back to Bookings')),
        ]),
      ),
    ),
  );
}
