import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';

import '../../core/theme.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/error_state_widget.dart';

enum VendorPlanType { free, pro, elite }

class VendorPlan {
  final VendorPlanType type;
  final String name;
  final int monthlyPrice;
  final List<String> features;
  final Color color;

  const VendorPlan({
    required this.type,
    required this.name,
    required this.monthlyPrice,
    required this.features,
    required this.color,
  });
}

class VendorSubscriptionScreen extends StatefulWidget {
  const VendorSubscriptionScreen({super.key});

  @override
  State<VendorSubscriptionScreen> createState() => _VendorSubscriptionScreenState();
}

class _VendorSubscriptionScreenState extends State<VendorSubscriptionScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  final List<VendorPlan> _plans = _vendorPlans;
  VendorPlanType _currentPlan = VendorPlanType.free;
  VendorPlanType _selectedPlan = VendorPlanType.pro;
  bool _annualBilling = false;

  @override
  void initState() {
    super.initState();
    _loadPlans();
  }

  Future<void> _loadPlans() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      await Future<void>.delayed(const Duration(milliseconds: 600));
      if (!mounted) return;
      setState(() => _isLoading = false);
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = 'Unable to load subscription plans.';
      });
    }
  }

  int _displayPrice(VendorPlan plan) {
    if (plan.type == VendorPlanType.free) return 0;
    if (_annualBilling) {
      return plan.monthlyPrice * 10;
    }
    return plan.monthlyPrice;
  }

  Future<void> _showUpgradeSheet() async {
    final plan = _plans.firstWhere((item) => item.type == _selectedPlan);
    final price = _displayPrice(plan);

    await HapticFeedback.lightImpact();
    if (!mounted) return;

    await showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Upgrade summary', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 16),
                _PaymentRow(label: 'Plan', value: plan.name),
                const SizedBox(height: 12),
                _PaymentRow(label: 'Billing', value: _annualBilling ? 'Annual (2 months free)' : 'Monthly'),
                const SizedBox(height: 12),
                _PaymentRow(label: 'Amount', value: _currency(price)),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      await HapticFeedback.lightImpact();
                      if (!context.mounted) return;
                      Navigator.pop(context);
                      setState(() => _currentPlan = _selectedPlan);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Redirecting to payment...')),
                      );
                    },
                    child: const Text('Proceed with Razorpay'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(title: const Text('WeddingOS Pro')),
        body: ListView.separated(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          itemBuilder: (_, __) => Shimmer.fromColors(
            baseColor: Colors.grey[300]!,
            highlightColor: Colors.grey[100]!,
            child: Container(
              height: 180,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
              ),
            ),
          ),
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemCount: 4,
        ),
      );
    }

    if (_errorMessage != null) {
      return Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(title: const Text('WeddingOS Pro')),
        body: ErrorStateWidget(message: _errorMessage!, onRetry: _loadPlans),
      );
    }

    if (_plans.isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(title: const Text('WeddingOS Pro')),
        body: EmptyStateWidget(
          icon: Icons.workspace_premium_outlined,
          title: 'No plans available',
          message: 'Subscription plans will be available soon for vendor growth tools.',
          actionLabel: 'Retry',
          onAction: _loadPlans,
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('WeddingOS Pro')),
      body: RefreshIndicator(
        color: AppColors.gold,
        onRefresh: _loadPlans,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFF59E0B), Color(0xFFFBBF24)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(28),
              ),
              child: Row(
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: const Icon(Icons.workspace_premium_rounded, color: Colors.white, size: 32),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'WeddingOS Pro',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                              ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Current plan: ${_planLabel(_currentPlan)}',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.18),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      _planLabel(_currentPlan),
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            SwitchListTile.adaptive(
              value: _annualBilling,
              activeColor: AppColors.gold,
              title: const Text('Annual billing'),
              subtitle: const Text('Save 2 months with yearly billing'),
              secondary: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.success.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Text(
                  '2 months free',
                  style: TextStyle(color: AppColors.success, fontWeight: FontWeight.w700, fontSize: 12),
                ),
              ),
              onChanged: (value) async {
                await HapticFeedback.lightImpact();
                setState(() => _annualBilling = value);
              },
            ),
            const SizedBox(height: 8),
            ..._plans.map(
              (plan) => Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: _PlanCard(
                  plan: plan,
                  isCurrent: _currentPlan == plan.type,
                  isSelected: _selectedPlan == plan.type,
                  billingPrice: _displayPrice(plan),
                  annualBilling: _annualBilling,
                  onSelect: () async {
                    await HapticFeedback.lightImpact();
                    setState(() => _selectedPlan = plan.type);
                  },
                ),
              ),
            ),
            const SizedBox(height: 8),
            _FeatureComparisonTable(currentPlan: _currentPlan),
            const SizedBox(height: 20),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.gold),
              onPressed: _selectedPlan == VendorPlanType.free ? null : _showUpgradeSheet,
              child: Text('Upgrade to ${_planLabel(_selectedPlan)}'),
            ),
            if (_currentPlan != VendorPlanType.free) ...[
              const SizedBox(height: 12),
              TextButton(
                onPressed: () async {
                  await HapticFeedback.lightImpact();
                  setState(() => _currentPlan = VendorPlanType.free);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Subscription cancelled for next billing cycle.')),
                  );
                },
                child: const Text('Cancel subscription', style: TextStyle(color: AppColors.error)),
              ),
            ],
            const SizedBox(height: 20),
            Text('Vendor testimonials', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            ..._testimonials.map(
              (testimonial) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _TestimonialCard(testimonial: testimonial),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  final VendorPlan plan;
  final bool isCurrent;
  final bool isSelected;
  final int billingPrice;
  final bool annualBilling;
  final VoidCallback onSelect;

  const _PlanCard({
    required this.plan,
    required this.isCurrent,
    required this.isSelected,
    required this.billingPrice,
    required this.annualBilling,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(24),
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: onSelect,
        child: Ink(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: isSelected ? plan.color : AppColors.border, width: isSelected ? 1.5 : 1),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(plan.name, style: Theme.of(context).textTheme.titleLarge),
                        const SizedBox(height: 6),
                        Text(
                          plan.type == VendorPlanType.free
                              ? 'Perfect to get started'
                              : annualBilling
                                  ? '${_currency(billingPrice)} / year'
                                  : '${_currency(billingPrice)} / month',
                          style: TextStyle(color: plan.color, fontWeight: FontWeight.w800, fontSize: 18),
                        ),
                      ],
                    ),
                  ),
                  if (isCurrent)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.success.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: const Text(
                        'Current',
                        style: TextStyle(color: AppColors.success, fontWeight: FontWeight.w700),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 14),
              ...plan.features.map(
                (feature) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.check_circle_rounded, size: 18, color: plan.color),
                      const SizedBox(width: 8),
                      Expanded(child: Text(feature)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FeatureComparisonTable extends StatelessWidget {
  final VendorPlanType currentPlan;

  const _FeatureComparisonTable({required this.currentPlan});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Feature comparison', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          Table(
            columnWidths: const {
              0: FlexColumnWidth(2.5),
              1: FlexColumnWidth(),
              2: FlexColumnWidth(),
              3: FlexColumnWidth(),
            },
            children: [
              const TableRow(
                children: [
                  Padding(padding: EdgeInsets.only(bottom: 12), child: Text('Feature', style: TextStyle(fontWeight: FontWeight.w700))),
                  Padding(padding: EdgeInsets.only(bottom: 12), child: Text('Free', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w700))),
                  Padding(padding: EdgeInsets.only(bottom: 12), child: Text('Pro', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w700))),
                  Padding(padding: EdgeInsets.only(bottom: 12), child: Text('Elite', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w700))),
                ],
              ),
              ..._comparisonRows.map(
                (row) => TableRow(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      child: Text(row.feature),
                    ),
                    _FeatureCell(enabled: row.free),
                    _FeatureCell(enabled: row.pro),
                    _FeatureCell(enabled: row.elite),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Your current plan: ${_planLabel(currentPlan)}',
            style: const TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _FeatureCell extends StatelessWidget {
  final bool enabled;

  const _FeatureCell({required this.enabled});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Icon(
        enabled ? Icons.check_circle_rounded : Icons.remove_circle_outline_rounded,
        color: enabled ? AppColors.success : AppColors.textMuted,
      ),
    );
  }
}

class _PaymentRow extends StatelessWidget {
  final String label;
  final String value;

  const _PaymentRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textSecondary)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
      ],
    );
  }
}

class _TestimonialCard extends StatelessWidget {
  final Map<String, String> testimonial;

  const _TestimonialCard({required this.testimonial});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: List.generate(
              5,
              (_) => const Icon(Icons.star_rounded, size: 18, color: AppColors.gold),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            '“${testimonial['quote']}”',
            style: const TextStyle(height: 1.5, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 12),
          Text(
            testimonial['name']!,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          Text(
            testimonial['business']!,
            style: const TextStyle(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _ComparisonRow {
  final String feature;
  final bool free;
  final bool pro;
  final bool elite;

  const _ComparisonRow({required this.feature, required this.free, required this.pro, required this.elite});
}

final _currencyFormatter = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
String _currency(int amount) => _currencyFormatter.format(amount);

String _planLabel(VendorPlanType type) => switch (type) {
      VendorPlanType.free => 'Free',
      VendorPlanType.pro => 'Pro',
      VendorPlanType.elite => 'Elite',
    };

const _vendorPlans = <VendorPlan>[
  VendorPlan(
    type: VendorPlanType.free,
    name: 'Free',
    monthlyPrice: 0,
    color: AppColors.textSecondary,
    features: ['Profile listing', '5 photos', '2 packages', 'Basic analytics'],
  ),
  VendorPlan(
    type: VendorPlanType.pro,
    name: 'Pro',
    monthlyPrice: 2999,
    color: AppColors.gold,
    features: [
      'Unlimited photos',
      'Unlimited packages',
      'Priority listing',
      'Advanced analytics',
      'Verified badge',
      'SMS leads',
      'Customer chat',
    ],
  ),
  VendorPlan(
    type: VendorPlanType.elite,
    name: 'Elite',
    monthlyPrice: 5999,
    color: AppColors.brand,
    features: [
      'Everything in Pro',
      'Featured placement',
      'Video uploads',
      'AI matching',
      'Dedicated manager',
      'Custom booking page',
    ],
  ),
];

const _comparisonRows = <_ComparisonRow>[
  _ComparisonRow(feature: 'Profile listing', free: true, pro: true, elite: true),
  _ComparisonRow(feature: 'Priority listing', free: false, pro: true, elite: true),
  _ComparisonRow(feature: 'Verified badge', free: false, pro: true, elite: true),
  _ComparisonRow(feature: 'Video uploads', free: false, pro: false, elite: true),
  _ComparisonRow(feature: 'Advanced analytics', free: false, pro: true, elite: true),
  _ComparisonRow(feature: 'AI matching', free: false, pro: false, elite: true),
  _ComparisonRow(feature: 'Dedicated manager', free: false, pro: false, elite: true),
  _ComparisonRow(feature: 'Customer chat', free: false, pro: true, elite: true),
];

const _testimonials = <Map<String, String>>[
  {
    'name': 'Sowjanya Reddy',
    'business': 'Blooms & Dreams Decor, Hyderabad',
    'quote': 'WeddingOS Pro doubled our inbound leads within two months and the verified badge built instant trust.',
  },
  {
    'name': 'Naveen Kumar',
    'business': 'Beats & Bass DJ',
    'quote': 'The advanced analytics helped us spot high-converting wedding dates and target sangeet bookings better.',
  },
  {
    'name': 'Fatima Sheikh',
    'business': 'Mehndi by Fatima',
    'quote': 'Elite gave us featured placement and a dedicated manager, which made festive season coordination stress-free.',
  },
];
