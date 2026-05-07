import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile'), actions: [
        IconButton(icon: const Icon(Icons.settings_outlined), onPressed: () {}),
      ]),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // ─── Avatar Card ──────────
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [AppColors.brand, Color(0xFF9333EA)]),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundColor: Colors.white.withOpacity(0.2),
                    child: const Text('RS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Rahul Sharma', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                        const SizedBox(height: 4),
                        Text('+91 98765 43210', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 13)),
                        const SizedBox(height: 2),
                        Text('Wedding: Mar 15, 2025', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(10)),
                    child: const Icon(Icons.edit, color: Colors.white, size: 18),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // ─── Stats Row ────────────
            Row(
              children: [
                _StatCard(value: '4', label: 'Bookings', icon: Icons.event, color: Colors.blue),
                const SizedBox(width: 12),
                _StatCard(value: '₹9.1L', label: 'Total Spent', icon: Icons.account_balance_wallet, color: Colors.green),
                const SizedBox(width: 12),
                _StatCard(value: '12', label: 'Wishlisted', icon: Icons.favorite, color: Colors.red),
              ],
            ),
            const SizedBox(height: 24),

            // ─── Menu Items ──────────
            _MenuItem(icon: Icons.person_outline, title: 'Personal Details', subtitle: 'Name, email, wedding date', onTap: () {}),
            _MenuItem(icon: Icons.event_note, title: 'My Bookings', subtitle: 'View all your vendor bookings', onTap: () => context.go('/bookings')),
            _MenuItem(icon: Icons.favorite_border, title: 'Wishlist', subtitle: '12 vendors saved', onTap: () {}),
            _MenuItem(icon: Icons.account_balance_wallet_outlined, title: 'Payments & Escrow', subtitle: 'Transaction history & receipts', onTap: () {}),
            _MenuItem(icon: Icons.checklist, title: 'Wedding Checklist', subtitle: '23 of 45 tasks completed', onTap: () {}),
            _MenuItem(icon: Icons.chat_outlined, title: 'Messages', subtitle: '3 unread conversations', onTap: () {}),
            _MenuItem(icon: Icons.help_outline, title: 'Help & Support', subtitle: 'FAQs, contact us', onTap: () {}),
            _MenuItem(icon: Icons.info_outline, title: 'About Wedding OS', subtitle: 'Version 1.0.0', onTap: () {}),
            const SizedBox(height: 16),

            // ─── Logout ──────────────
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => context.go('/login'),
                icon: const Icon(Icons.logout, color: Colors.red),
                label: const Text('Logout', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w600)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.red),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String value, label;
  final IconData icon;
  final Color color;
  const _StatCard({required this.value, required this.label, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(color: AppColors.textMuted, fontSize: 10)),
          ],
        ),
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String title, subtitle;
  final VoidCallback onTap;
  const _MenuItem({required this.icon, required this.title, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: ListTile(
        onTap: onTap,
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: AppColors.brandLight, borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: AppColors.brand, size: 20),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        subtitle: Text(subtitle, style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
        trailing: Icon(Icons.chevron_right, color: AppColors.textMuted, size: 20),
        contentPadding: EdgeInsets.zero,
      ),
    );
  }
}
