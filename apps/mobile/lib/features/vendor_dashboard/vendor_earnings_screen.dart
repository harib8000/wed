import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';

class VendorEarningsScreen extends ConsumerWidget {
  const VendorEarningsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Earnings'),
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ─── Earnings Summary Card ──────
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.brand, AppColors.brand.withOpacity(0.8)],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Total Earnings',
                      style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 13)),
                  const SizedBox(height: 4),
                  const Text('₹28,50,000',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 32)),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      _EarningChip(label: 'This Month', value: '₹2,50,000', icon: Icons.trending_up),
                      const SizedBox(width: 16),
                      _EarningChip(label: 'Pending', value: '₹4,75,000', icon: Icons.hourglass_top),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // ─── Payout Schedule ────────────
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
                      Text('Next Payout', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      Text('Feb 5, 2025', style: TextStyle(color: AppColors.brand, fontSize: 13, fontWeight: FontWeight.w500)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.account_balance, color: Colors.green, size: 20),
                        SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('₹1,25,000', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.green)),
                              Text('HDFC Bank ****4521', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                            ],
                          ),
                        ),
                        Icon(Icons.check_circle, color: Colors.green, size: 20),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // ─── Escrow Status ──────────────
            const Text('Escrow Status', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            _EscrowCard(
              customer: 'Divya & Pranav',
              amount: '₹5,00,000',
              status: 'Held in Escrow',
              statusColor: Colors.orange,
              eventDate: 'Apr 10, 2025',
              progress: 0.5,
            ),
            _EscrowCard(
              customer: 'Priya & Rohit',
              amount: '₹2,75,000',
              status: 'Partially Released',
              statusColor: Colors.blue,
              eventDate: 'Apr 25, 2025',
              progress: 0.3,
            ),
            _EscrowCard(
              customer: 'Kavya & Suresh',
              amount: '₹8,50,000',
              status: 'Held in Escrow',
              statusColor: Colors.orange,
              eventDate: 'May 1, 2025',
              progress: 0.0,
            ),

            const SizedBox(height: 20),

            // ─── Transaction History ────────
            const Text('Recent Transactions', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            ..._transactions.map((t) => _TransactionTile(data: t)),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}

class _EarningChip extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  const _EarningChip({required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            Icon(icon, size: 16, color: Colors.white.withOpacity(0.8)),
            const SizedBox(width: 6),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                Text(label, style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _EscrowCard extends StatelessWidget {
  final String customer;
  final String amount;
  final String status;
  final Color statusColor;
  final String eventDate;
  final double progress;
  const _EscrowCard({required this.customer, required this.amount, required this.status, required this.statusColor, required this.eventDate, required this.progress});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(customer, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    const SizedBox(height: 2),
                    Text('Event: $eventDate', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(amount, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(status, style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.w500)),
                  ),
                ],
              ),
            ],
          ),
          if (progress > 0) ...[
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progress,
                backgroundColor: AppColors.border,
                valueColor: AlwaysStoppedAnimation(statusColor),
                minHeight: 4,
              ),
            ),
          ],
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
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: (data.isCredit ? Colors.green : Colors.red).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              data.isCredit ? Icons.arrow_downward : Icons.arrow_upward,
              color: data.isCredit ? Colors.green : Colors.red,
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
              fontWeight: FontWeight.bold,
              color: data.isCredit ? Colors.green : Colors.red,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}

class _TransactionData {
  final String description;
  final String amount;
  final String date;
  final bool isCredit;
  const _TransactionData({required this.description, required this.amount, required this.date, required this.isCredit});
}

const _transactions = [
  _TransactionData(description: 'Escrow Release - Harini & Vishnu', amount: '₹3,75,000', date: 'Jan 18, 2025', isCredit: true),
  _TransactionData(description: 'Escrow Release - Sowmya & Deepak', amount: '₹2,50,000', date: 'Jan 15, 2025', isCredit: true),
  _TransactionData(description: 'Platform Fee (5%)', amount: '₹18,750', date: 'Jan 18, 2025', isCredit: false),
  _TransactionData(description: 'Escrow Release - Ananya & Raj', amount: '₹4,00,000', date: 'Jan 5, 2025', isCredit: true),
  _TransactionData(description: 'Platform Fee (5%)', amount: '₹20,000', date: 'Jan 5, 2025', isCredit: false),
];
