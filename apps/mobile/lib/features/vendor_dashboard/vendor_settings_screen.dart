import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';

class VendorSettingsScreen extends ConsumerWidget {
  const VendorSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('Settings')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ─── Account ──────────────────────
            _SectionHeader(title: 'Account'),
            _SettingsCard(children: [
              _SettingsTile(
                icon: Icons.person_outline, label: 'Business Name',
                value: user?.name ?? 'Vendor', onTap: () {},
              ),
              _SettingsTile(
                icon: Icons.phone_outlined, label: 'Phone Number',
                value: user?.phone ?? '---', onTap: () {},
              ),
              _SettingsTile(
                icon: Icons.email_outlined, label: 'Email',
                value: user?.email ?? 'Not set', onTap: () {},
              ),
              _SettingsTile(
                icon: Icons.location_on_outlined, label: 'Business Location',
                value: user?.city ?? 'Not set', onTap: () {},
              ),
            ]),

            const SizedBox(height: 16),

            // ─── Notifications ────────────────
            _SectionHeader(title: 'Notifications'),
            _SettingsCard(children: [
              _ToggleTile(icon: Icons.mail_outline, label: 'New Enquiry Alerts', value: true, onChanged: (_) {}),
              _ToggleTile(icon: Icons.event_available, label: 'Booking Confirmed', value: true, onChanged: (_) {}),
              _ToggleTile(icon: Icons.payment, label: 'Payment Updates', value: true, onChanged: (_) {}),
              _ToggleTile(icon: Icons.star_outline, label: 'New Reviews', value: true, onChanged: (_) {}),
              _ToggleTile(icon: Icons.campaign_outlined, label: 'Marketing & Tips', value: false, onChanged: (_) {}),
            ]),

            const SizedBox(height: 16),

            // ─── Payment ──────────────────────
            _SectionHeader(title: 'Payment & Banking'),
            _SettingsCard(children: [
              _SettingsTile(
                icon: Icons.account_balance, label: 'Bank Account',
                value: 'HDFC ****4521', onTap: () {},
              ),
              _SettingsTile(
                icon: Icons.receipt_long, label: 'GST Number',
                value: '36AABCU9876H1Z2', onTap: () {},
              ),
              _SettingsTile(
                icon: Icons.badge_outlined, label: 'PAN',
                value: 'ABCDE1234F', onTap: () {},
              ),
              _SettingsTile(
                icon: Icons.schedule, label: 'Payout Schedule',
                value: 'Weekly (Monday)', onTap: () {},
              ),
            ]),

            const SizedBox(height: 16),

            // ─── Business ─────────────────────
            _SectionHeader(title: 'Business Settings'),
            _SettingsCard(children: [
              _SettingsTile(
                icon: Icons.access_time, label: 'Business Hours',
                value: '9 AM - 9 PM', onTap: () {},
              ),
              _SettingsTile(
                icon: Icons.auto_awesome, label: 'Auto-Reply Message',
                value: 'Enabled', onTap: () {},
              ),
              _SettingsTile(
                icon: Icons.groups_outlined, label: 'Team Members',
                value: '3 members', onTap: () {},
              ),
              _SettingsTile(
                icon: Icons.description_outlined, label: 'Cancellation Policy',
                value: 'Standard', onTap: () {},
              ),
              _SettingsTile(
                icon: Icons.language, label: 'Languages Supported',
                value: 'English, Hindi, Telugu', onTap: () {},
              ),
            ]),

            const SizedBox(height: 16),

            // ─── App ──────────────────────────
            _SectionHeader(title: 'App'),
            _SettingsCard(children: [
              _SettingsTile(
                icon: Icons.help_outline, label: 'Help & Support',
                onTap: () {},
              ),
              _SettingsTile(
                icon: Icons.policy_outlined, label: 'Privacy Policy',
                onTap: () {},
              ),
              _SettingsTile(
                icon: Icons.description_outlined, label: 'Terms of Service',
                onTap: () {},
              ),
              _SettingsTile(
                icon: Icons.info_outline, label: 'App Version',
                value: '1.0.0',
                onTap: () {},
              ),
            ]),

            const SizedBox(height: 16),

            // Logout
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => ref.read(authProvider.notifier).logout(),
                icon: const Icon(Icons.logout, size: 18),
                label: const Text('Logout'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFEF4444),
                  side: const BorderSide(color: Color(0xFFEF4444)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppColors.textPrimary)),
    );
  }
}

class _SettingsCard extends StatelessWidget {
  final List<Widget> children;
  const _SettingsCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(children: children),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? value;
  final VoidCallback onTap;
  const _SettingsTile({required this.icon, required this.label, this.value, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: AppColors.brand.withOpacity(0.06),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 18, color: AppColors.brand),
      ),
      title: Text(label, style: const TextStyle(fontSize: 14)),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (value != null)
            Text(value!, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
          const SizedBox(width: 4),
          const Icon(Icons.chevron_right, size: 18, color: AppColors.textMuted),
        ],
      ),
      onTap: onTap,
    );
  }
}

class _ToggleTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _ToggleTile({required this.icon, required this.label, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      secondary: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: AppColors.brand.withOpacity(0.06),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 18, color: AppColors.brand),
      ),
      title: Text(label, style: const TextStyle(fontSize: 14)),
      value: value,
      onChanged: onChanged,
      activeColor: AppColors.brand,
    );
  }
}
