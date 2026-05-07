import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';
import '../../providers/vendor_analytics_provider.dart';

class VendorEarningsScreen extends ConsumerWidget {
  const VendorEarningsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final analyticsAsync = ref.watch(vendorAnalyticsProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Earnings'),
        automaticallyImplyLeading: false,
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.border),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.download_outlined, size: 14, color: AppColors.textSecondary),
                SizedBox(width: 4),
                Text('Export', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ],
            ),
          ),
        ],
      ),
      body: analyticsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (a) => _EarningsBody(revenue: a.revenue, monthlyData: a.monthlyRevenue),
      ),
    );
  }
}

class _EarningsBody extends StatelessWidget {
  final dynamic revenue;
  final List monthlyData;
  const _EarningsBody({required this.revenue, required this.monthlyData});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ─── Revenue Hero Card ────────────
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1E1B4B), Color(0xFF312E81)],
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [BoxShadow(color: const Color(0xFF1E1B4B).withOpacity(0.3), blurRadius: 16, offset: const Offset(0, 8))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Total Earned', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 13)),
                const SizedBox(height: 4),
                const Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('₹28,50,000', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 32)),
                    SizedBox(width: 8),
                    Padding(
                      padding: EdgeInsets.only(bottom: 4),
                      child: Text('+18.5%', style: TextStyle(color: Color(0xFF34D399), fontSize: 13, fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    _RevenueChip(label: 'This Month', value: '₹2.5L', icon: Icons.trending_up, color: const Color(0xFF34D399)),
                    const SizedBox(width: 10),
                    _RevenueChip(label: 'Pending', value: '₹4.75L', icon: Icons.hourglass_top, color: const Color(0xFFFBBF24)),
                    const SizedBox(width: 10),
                    _RevenueChip(label: 'In Escrow', value: '₹16.25L', icon: Icons.lock_outline, color: const Color(0xFF60A5FA)),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // ─── Payout Status ────────────────
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Next Payout', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                    Text('Feb 5, 2025', style: TextStyle(color: AppColors.brand, fontWeight: FontWeight.w600, fontSize: 13)),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [const Color(0xFF10B981).withOpacity(0.05), const Color(0xFF10B981).withOpacity(0.02)]),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF10B981).withOpacity(0.2)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.account_balance, color: Color(0xFF10B981), size: 20),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('₹1,25,000', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: Color(0xFF10B981))),
                            Text('HDFC Bank ****4521 · Auto-payout', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                          ],
                        ),
                      ),
                      const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 22),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // ─── Escrow Dashboard ─────────────
          const Text('Active Escrows', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          const SizedBox(height: 12),
          _EscrowCard(
            customer: 'Divya & Pranav', event: 'Wedding · Apr 10',
            amount: '₹5,00,000', paid: '₹2,50,000', emoji: '💒',
            progress: 0.5, status: 'Milestone 2/4',
          ),
          _EscrowCard(
            customer: 'Priya & Rohit', event: 'Reception · Apr 25',
            amount: '₹2,75,000', paid: '₹82,500', emoji: '🎉',
            progress: 0.3, status: 'Advance Paid',
          ),
          _EscrowCard(
            customer: 'Kavya & Suresh', event: 'Wedding · May 1',
            amount: '₹8,50,000', paid: '₹0', emoji: '💒',
            progress: 0.0, status: 'Payment Pending',
          ),

          const SizedBox(height: 20),

          // ─── Tax Summary ──────────────────
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Tax Summary (FY 2024-25)', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                const SizedBox(height: 12),
                _TaxRow(label: 'Gross Revenue', value: '₹28,50,000', isBold: true),
                _TaxRow(label: 'Platform Commission (5%)', value: '-₹1,42,500'),
                _TaxRow(label: 'GST Collected (18%)', value: '₹5,13,000'),
                _TaxRow(label: 'TDS Deducted (1%)', value: '-₹28,500'),
                const Divider(height: 20),
                _TaxRow(label: 'Net Receivable', value: '₹31,92,000', isBold: true, color: const Color(0xFF10B981)),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // ─── Transaction History ──────────
          const Text('Recent Transactions', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          const SizedBox(height: 12),
          ...List.generate(_transactions.length, (i) => _TransactionTile(data: _transactions[i])),

          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _RevenueChip extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;

  const _RevenueChip({required this.label, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.08),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 13)),
            Text(label, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 9)),
          ],
        ),
      ),
    );
  }
}

class _EscrowCard extends StatelessWidget {
  final String customer, event, amount, paid, emoji, status;
  final double progress;

  const _EscrowCard({required this.customer, required this.event, required this.amount, required this.paid, required this.emoji, required this.progress, required this.status});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(
                  color: AppColors.brand.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(child: Text(emoji, style: const TextStyle(fontSize: 18))),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(customer, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                    Text(event, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(amount, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                  Text('Paid: $paid', style: const TextStyle(color: AppColors.textMuted, fontSize: 10)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progress,
                    backgroundColor: AppColors.surface,
                    valueColor: AlwaysStoppedAnimation(progress > 0 ? AppColors.brand : AppColors.border),
                    minHeight: 6,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(status, style: const TextStyle(fontSize: 10, color: AppColors.textMuted, fontWeight: FontWeight.w500)),
            ],
          ),
        ],
      ),
    );
  }
}

class _TaxRow extends StatelessWidget {
  final String label, value;
  final bool isBold;
  final Color? color;
  const _TaxRow({required this.label, required this.value, this.isBold = false, this.color});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 13, fontWeight: isBold ? FontWeight.w600 : FontWeight.normal, color: color ?? AppColors.textSecondary)),
          Text(value, style: TextStyle(fontSize: 13, fontWeight: isBold ? FontWeight.w700 : FontWeight.w500, color: color ?? AppColors.textPrimary)),
        ],
      ),
    );
  }
}

class _TransactionTile extends StatelessWidget {
  final _TransactionData data;
  const _TransactionTile({required this.data});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: (data.isCredit ? const Color(0xFF10B981) : const Color(0xFFEF4444)).withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              data.isCredit ? Icons.south_west : Icons.north_east,
              color: data.isCredit ? const Color(0xFF10B981) : const Color(0xFFEF4444),
              size: 16,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(data.description, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
                Text(data.date, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
              ],
            ),
          ),
          Text(
            '${data.isCredit ? '+' : '-'}${data.amount}',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: data.isCredit ? const Color(0xFF10B981) : const Color(0xFFEF4444),
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}

class _TransactionData {
  final String description, amount, date;
  final bool isCredit;
  const _TransactionData({required this.description, required this.amount, required this.date, required this.isCredit});
}

const _transactions = [
  _TransactionData(description: 'Escrow Release · Harini & Vishnu', amount: '₹3,75,000', date: 'Jan 18, 2025', isCredit: true),
  _TransactionData(description: 'Escrow Release · Sowmya & Deepak', amount: '₹2,50,000', date: 'Jan 15, 2025', isCredit: true),
  _TransactionData(description: 'Platform Fee (5%)', amount: '₹18,750', date: 'Jan 18, 2025', isCredit: false),
  _TransactionData(description: 'Escrow Release · Ananya & Raj', amount: '₹4,00,000', date: 'Jan 5, 2025', isCredit: true),
  _TransactionData(description: 'Platform Fee (5%)', amount: '₹20,000', date: 'Jan 5, 2025', isCredit: false),
  _TransactionData(description: 'TDS Deducted', amount: '₹3,750', date: 'Jan 18, 2025', isCredit: false),
];
