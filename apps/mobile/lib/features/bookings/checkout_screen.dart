import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../core/theme.dart';
import '../../models/vendor.dart';
import '../../providers/booking_provider.dart';
import '../../providers/vendor_provider.dart';

// ─── Checkout Screen ───────────────────────────────────────
class CheckoutScreen extends ConsumerStatefulWidget {
  final String vendorId;
  final String? existingBookingId;
  final int? prefilledAmount;

  const CheckoutScreen({
    super.key,
    required this.vendorId,
    this.existingBookingId,
    this.prefilledAmount,
  });

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  VendorPackage? _selectedPackage;
  String _eventDate = '';
  String _paymentMethod = 'upi';
  bool _isSubmitting = false;
  String _error = '';
  final _dateCtrl = TextEditingController();
  final _cityCtrl = TextEditingController(text: 'Hyderabad');
  final _guestCtrl = TextEditingController(text: '300');
  final _reqCtrl = TextEditingController();

  @override
  void dispose() {
    _dateCtrl.dispose();
    _cityCtrl.dispose();
    _guestCtrl.dispose();
    _reqCtrl.dispose();
    super.dispose();
  }

  String _fmt(int p) => '₹${NumberFormat('#,##,###').format(p ~/ 100)}';

  int get _advance => _selectedPackage != null ? (_selectedPackage!.priceFromPaise * 0.3).round() : 0;
  int get _platformFee => _selectedPackage != null ? (_selectedPackage!.priceFromPaise * 0.118).round() : 0;

  Future<void> _submit() async {
    if (_selectedPackage == null) {
      setState(() => _error = 'Please select a package');
      return;
    }
    if (_eventDate.isEmpty) {
      setState(() => _error = 'Please select your wedding date');
      return;
    }
    setState(() { _error = ''; _isSubmitting = true; });

    try {
      final booking = await ref.read(bookingsProvider.notifier).createBooking({
        'vendorId': widget.vendorId,
        'packageId': _selectedPackage!.id,
        'eventDate': _eventDate,
        'eventType': 'WEDDING',
        'eventCity': _cityCtrl.text,
        'guestCount': int.tryParse(_guestCtrl.text) ?? 300,
        'requirements': _reqCtrl.text,
      });

      if (booking != null && mounted) {
        context.pushReplacement('/bookings/${booking.id}');
      }
    } catch (e) {
      setState(() => _error = 'Something went wrong. Please try again.');
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _pickDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 90)),
      firstDate: DateTime.now().add(const Duration(days: 7)),
      lastDate: DateTime.now().add(const Duration(days: 730)),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(colorScheme: ColorScheme.light(primary: AppColors.brand)),
        child: child!,
      ),
    );
    if (date != null) {
      setState(() {
        _eventDate = DateFormat('yyyy-MM-dd').format(date);
        _dateCtrl.text = DateFormat('d MMM yyyy').format(date);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final vendorAsync = ref.watch(vendorDetailProvider(widget.vendorId));

    return Scaffold(
      appBar: AppBar(title: const Text('Book Vendor'), elevation: 0),
      body: vendorAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('Could not load vendor')),
        data: (vendor) => _buildBody(context, vendor),
      ),
    );
  }

  Widget _buildBody(BuildContext context, Vendor vendor) {
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              // Vendor summary
              _VendorSummary(vendor: vendor),
              const SizedBox(height: 20),

              // 1. Package
              _SectionTitle(number: '1', title: 'Select Package'),
              const SizedBox(height: 10),
              ...vendor.packages.map((pkg) => _PackageTile(
                pkg: pkg,
                selected: _selectedPackage?.id == pkg.id,
                onTap: () => setState(() => _selectedPackage = pkg),
              )).toList(),
              const SizedBox(height: 20),

              // 2. Event Details
              _SectionTitle(number: '2', title: 'Event Details'),
              const SizedBox(height: 10),
              _buildEventForm(),
              const SizedBox(height: 20),

              // 3. Payment Method
              _SectionTitle(number: '3', title: 'Payment Method'),
              const SizedBox(height: 10),
              _buildPaymentMethods(),
              const SizedBox(height: 20),

              // Escrow note
              _EscrowNote(),

              // Price summary
              if (_selectedPackage != null) ...[
                const SizedBox(height: 16),
                _PriceSummary(pkg: _selectedPackage!, advance: _advance, platformFee: _platformFee, fmt: _fmt),
              ],

              // Error
              if (_error.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.red.shade200)),
                  child: Row(children: [
                    const Icon(Icons.error_outline, color: Colors.red, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(_error, style: const TextStyle(color: Colors.red, fontSize: 13))),
                  ]),
                ),
              ],
              const SizedBox(height: 24),
            ]),
          ),
        ),

        // CTA
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(width: double.infinity, child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.brand,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _isSubmitting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                      const Icon(Icons.lock, size: 16),
                      const SizedBox(width: 8),
                      Text(
                        _selectedPackage != null ? 'Send Enquiry · ${_fmt(_selectedPackage!.priceFromPaise)} onwards' : 'Select Package to Continue',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                    ]),
            )),
          ),
        ),
      ],
    );
  }

  Widget _buildEventForm() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
      child: Column(children: [
        _FormField(
          label: 'Wedding Date',
          icon: Icons.calendar_today,
          controller: _dateCtrl,
          readOnly: true,
          onTap: _pickDate,
          hint: 'Tap to select date',
        ),
        const Divider(height: 20),
        _FormField(
          label: 'Event City',
          icon: Icons.location_on_outlined,
          controller: _cityCtrl,
          hint: 'e.g. Hyderabad',
        ),
        const Divider(height: 20),
        _FormField(
          label: 'Guest Count',
          icon: Icons.group_outlined,
          controller: _guestCtrl,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          hint: 'e.g. 300',
        ),
        const Divider(height: 20),
        _FormField(
          label: 'Requirements',
          icon: Icons.notes_outlined,
          controller: _reqCtrl,
          maxLines: 3,
          hint: 'Any special requests or requirements...',
        ),
      ]),
    );
  }

  Widget _buildPaymentMethods() {
    const methods = [
      ('upi', Icons.smartphone_outlined, 'UPI', 'PhonePe, GPay, Paytm'),
      ('card', Icons.credit_card_outlined, 'Card', 'Credit / Debit card'),
      ('netbanking', Icons.account_balance_outlined, 'Net Banking', 'All major banks'),
    ];
    return Row(children: methods.map((m) => Expanded(child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: GestureDetector(
        onTap: () => setState(() => _paymentMethod = m.$1),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: _paymentMethod == m.$1 ? AppColors.brandLight : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: _paymentMethod == m.$1 ? AppColors.brand : AppColors.border, width: _paymentMethod == m.$1 ? 2 : 1),
          ),
          child: Column(children: [
            Icon(m.$2, color: _paymentMethod == m.$1 ? AppColors.brand : AppColors.textMuted, size: 22),
            const SizedBox(height: 4),
            Text(m.$3, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 11, color: _paymentMethod == m.$1 ? AppColors.brand : AppColors.textPrimary)),
            Text(m.$4, style: TextStyle(fontSize: 9, color: AppColors.textMuted), textAlign: TextAlign.center),
          ]),
        ),
      ),
    ))).toList());
  }
}

// ─── Widgets ───────────────────────────────────────────────
class _VendorSummary extends StatelessWidget {
  final Vendor vendor;
  const _VendorSummary({required this.vendor});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
    child: Row(children: [
      ClipRRect(borderRadius: BorderRadius.circular(10), child: CachedNetworkImage(imageUrl: vendor.displayImage, width: 64, height: 64, fit: BoxFit.cover)),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(vendor.businessName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        Text('${vendor.category} · ${vendor.city}', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
        Row(children: [
          const Icon(Icons.star, color: AppColors.gold, size: 14),
          Text(' ${vendor.avgRating.toStringAsFixed(1)} (${vendor.reviewCount})', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        ]),
      ])),
    ]),
  );
}

class _SectionTitle extends StatelessWidget {
  final String number, title;
  const _SectionTitle({required this.number, required this.title});
  @override
  Widget build(BuildContext context) => Row(children: [
    Container(width: 24, height: 24, decoration: BoxDecoration(color: AppColors.brand, shape: BoxShape.circle), child: Center(child: Text(number, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)))),
    const SizedBox(width: 8),
    Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
  ]);
}

class _PackageTile extends StatelessWidget {
  final VendorPackage pkg;
  final bool selected;
  final VoidCallback onTap;
  const _PackageTile({required this.pkg, required this.selected, required this.onTap});

  static const _typeColors = {'BASIC': Color(0xFF6B7280), 'STANDARD': Color(0xFF2563EB), 'PREMIUM': Color(0xFF7C3AED), 'CUSTOM': Color(0xFFEA580C)};

  @override
  Widget build(BuildContext context) {
    final color = _typeColors[pkg.packageType] ?? const Color(0xFF6B7280);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? AppColors.brandLight : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: selected ? AppColors.brand : AppColors.border, width: selected ? 2 : 1),
        ),
        child: Row(children: [
          Container(width: 22, height: 22, decoration: BoxDecoration(color: selected ? AppColors.brand : Colors.grey.shade200, shape: BoxShape.circle), child: selected ? const Icon(Icons.check, color: Colors.white, size: 14) : null),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Text(pkg.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              const SizedBox(width: 6),
              Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(6)), child: Text(pkg.packageType, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w600))),
            ]),
            if (pkg.description != null) Text(pkg.description!, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
          ])),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text('₹${NumberFormat('#,##,###').format(pkg.priceFromPaise ~/ 100)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            Text('Advance: ₹${NumberFormat('#,##,###').format((pkg.priceFromPaise * 0.3) ~/ 100)}', style: const TextStyle(color: AppColors.brand, fontSize: 10)),
          ]),
        ]),
      ),
    );
  }
}

class _FormField extends StatelessWidget {
  final String label, hint;
  final IconData icon;
  final TextEditingController controller;
  final bool readOnly;
  final VoidCallback? onTap;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? inputFormatters;
  final int maxLines;
  const _FormField({required this.label, required this.icon, required this.controller, this.hint = '', this.readOnly = false, this.onTap, this.keyboardType, this.inputFormatters, this.maxLines = 1});

  @override
  Widget build(BuildContext context) => TextField(
    controller: controller,
    readOnly: readOnly,
    onTap: onTap,
    keyboardType: keyboardType,
    inputFormatters: inputFormatters,
    maxLines: maxLines,
    decoration: InputDecoration(
      labelText: label,
      hintText: hint,
      prefixIcon: Icon(icon, size: 18, color: AppColors.brand),
      border: InputBorder.none,
      contentPadding: const EdgeInsets.symmetric(vertical: 4),
    ),
  );
}

class _EscrowNote extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.green.shade200)),
    child: Row(children: [
      const Icon(Icons.shield_outlined, color: Colors.green, size: 20),
      const SizedBox(width: 10),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Escrow Protection', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.green, fontSize: 13)),
        Text('Your advance is held securely and released only after the event', style: TextStyle(color: Colors.green.shade700, fontSize: 11)),
      ])),
    ]),
  );
}

class _PriceSummary extends StatelessWidget {
  final VendorPackage pkg;
  final int advance, platformFee;
  final String Function(int) fmt;
  const _PriceSummary({required this.pkg, required this.advance, required this.platformFee, required this.fmt});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Order Summary', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
      const SizedBox(height: 10),
      _SummaryRow('Package Price', fmt(pkg.priceFromPaise)),
      _SummaryRow('Platform Fee (incl. GST)', fmt(platformFee), small: true),
      const Divider(),
      _SummaryRow('Total', fmt(pkg.priceFromPaise), bold: true),
      const SizedBox(height: 8),
      Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: AppColors.brandLight, borderRadius: BorderRadius.circular(10)), child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Pay Now (30% advance)', style: TextStyle(color: AppColors.brand, fontWeight: FontWeight.bold, fontSize: 12)),
          Text('Balance paid on event day', style: TextStyle(color: AppColors.brand.withOpacity(0.7), fontSize: 10)),
        ]),
        Text(fmt(advance), style: const TextStyle(color: AppColors.brand, fontWeight: FontWeight.bold, fontSize: 18)),
      ])),
    ]),
  );
}

class _SummaryRow extends StatelessWidget {
  final String label, value;
  final bool bold, small;
  const _SummaryRow(this.label, this.value, {this.bold = false, this.small = false});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: TextStyle(color: AppColors.textSecondary, fontSize: small ? 11 : 13)),
      Text(value, style: TextStyle(fontWeight: bold ? FontWeight.bold : FontWeight.w500, fontSize: small ? 11 : 13)),
    ]),
  );
}
