import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _biometricEnabled = false;
  final _localAuth = LocalAuthentication();

  @override
  void initState() {
    super.initState();
    _loadBiometricSetting();
  }

  Future<void> _loadBiometricSetting() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (mounted) {
        setState(() => _biometricEnabled = prefs.getBool('biometric_enabled') ?? false);
      }
    } catch (_) {}
  }

  Future<void> _toggleBiometric(bool val) async {
    if (val) {
      // Check device support before enabling
      final canCheck = await _localAuth.canCheckBiometrics;
      final isSupported = await _localAuth.isDeviceSupported();
      if (!canCheck || !isSupported) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Biometric authentication is not available on this device.')),
          );
        }
        return;
      }
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('biometric_enabled', val);
    if (mounted) setState(() => _biometricEnabled = val);
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final themeMode = ref.watch(themeModeProvider);
    final isDark = themeMode == ThemeMode.dark;
    final initials = user?.name?.isNotEmpty == true
        ? user!.name!.trim().split(' ').map((w) => w.isNotEmpty ? w[0] : '').take(2).join().toUpperCase()
        : '?';

    return Scaffold(
      appBar: AppBar(title: const Text('Profile'), actions: [
        IconButton(icon: const Icon(Icons.settings_outlined), onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Settings coming soon!'), duration: Duration(seconds: 2)),
          );
        }),
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
                    child: Text(initials, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(user?.name ?? 'Welcome!', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                        const SizedBox(height: 4),
                        if (user != null)
                          Text(user.phone, style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 13)),
                        if (user?.weddingDate != null)
                          Text('Wedding: ${user!.weddingDate}', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12)),
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
              children: const [
                _StatCard(value: '4', label: 'Bookings', icon: Icons.event, color: Colors.blue),
                SizedBox(width: 12),
                _StatCard(value: '12', label: 'Wishlisted', icon: Icons.favorite, color: Colors.red),
                SizedBox(width: 12),
                _StatCard(value: '22', label: 'Tasks Done', icon: Icons.checklist, color: Colors.green),
              ],
            ),
            const SizedBox(height: 24),

            // ─── Menu Items ──────────
            _MenuItem(icon: Icons.person_outline, title: 'Personal Details', subtitle: 'Name, email, wedding date', onTap: () {}),
            _MenuItem(icon: Icons.event_note, title: 'My Bookings', subtitle: 'View all your vendor bookings', onTap: () => context.go('/bookings')),
            _MenuItem(icon: Icons.favorite_border, title: 'Wishlist', subtitle: 'Saved vendors', onTap: () => context.go('/wishlist')),
            _MenuItem(icon: Icons.notifications_outlined, title: 'Notifications', subtitle: 'Booking updates & reminders', onTap: () => context.push('/notifications')),
            _MenuItem(icon: Icons.checklist, title: 'Wedding Checklist', subtitle: 'Track your wedding prep', onTap: () => context.push('/checklist')),
            _MenuItem(icon: Icons.chat_outlined, title: 'Messages', subtitle: 'Chat with vendors', onTap: () {}),
            _MenuItem(icon: Icons.account_balance_wallet_outlined, title: 'Payments & Escrow', subtitle: 'Transaction history', onTap: () {}),
            _MenuItem(icon: Icons.help_outline, title: 'Help & Support', subtitle: 'FAQs, contact us', onTap: () {}),
            _MenuItem(icon: Icons.info_outline, title: 'About WeddingOS', subtitle: 'Version 1.0.0', onTap: () {}),

            // ─── Preferences ──────────
            const SizedBox(height: 8),
            _ToggleMenuItem(
              icon: isDark ? Icons.dark_mode : Icons.light_mode_outlined,
              title: 'Dark Mode',
              subtitle: 'Switch app appearance',
              value: isDark,
              onChanged: (val) => ref.read(themeModeProvider.notifier).setThemeMode(val ? ThemeMode.dark : ThemeMode.light),
            ),
            _ToggleMenuItem(
              icon: Icons.fingerprint,
              title: 'Biometric Login',
              subtitle: 'Use fingerprint or face ID to sign in',
              value: _biometricEnabled,
              onChanged: _toggleBiometric,
            ),
            const SizedBox(height: 16),

            // ─── Logout ──────────────
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () async {
                  await ref.read(authProvider.notifier).logout();
                  if (context.mounted) context.go('/login');
                },
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

class _ToggleMenuItem extends StatelessWidget {
  final IconData icon;
  final String title, subtitle;
  final bool value;
  final void Function(bool) onChanged;
  const _ToggleMenuItem({required this.icon, required this.title, required this.subtitle, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: AppColors.brandLight, borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: AppColors.brand, size: 20),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        subtitle: Text(subtitle, style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
        trailing: Switch(value: value, onChanged: onChanged, activeColor: AppColors.brand),
        contentPadding: EdgeInsets.zero,
      ),
    );
  }
}
