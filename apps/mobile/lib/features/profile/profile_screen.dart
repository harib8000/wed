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

  DateTime? _parseWeddingDate(String? value) {
    if (value == null || value.trim().isEmpty) return null;

    try {
      return DateTime.parse(value);
    } catch (_) {}

    final parts = value.trim().split(' ');
    if (parts.length != 3) return null;

    const months = {
      'jan': 1,
      'feb': 2,
      'mar': 3,
      'apr': 4,
      'may': 5,
      'jun': 6,
      'jul': 7,
      'aug': 8,
      'sep': 9,
      'oct': 10,
      'nov': 11,
      'dec': 12,
    };

    final day = int.tryParse(parts[0]);
    final month = months[parts[1].toLowerCase()];
    final year = int.tryParse(parts[2]);
    if (day == null || month == null || year == null) return null;

    return DateTime(year, month, day);
  }

  String _formatWeddingDate(DateTime date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final day = date.day.toString().padLeft(2, '0');
    return '$day ${months[date.month - 1]} ${date.year}';
  }

  Future<void> _showPersonalDetailsSheet() async {
    final user = ref.read(currentUserProvider);
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to update your profile.')),
      );
      return;
    }

    final nameController = TextEditingController(text: user.name ?? '');
    final emailController = TextEditingController(text: user.email ?? '');
    final weddingDateController = TextEditingController(text: user.weddingDate ?? '');
    final partnerNameController = TextEditingController(text: user.partnerName ?? '');
    final cityController = TextEditingController(text: user.city ?? '');
    DateTime? selectedWeddingDate = _parseWeddingDate(user.weddingDate);
    bool isSaving = false;

    final updated = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            Future<void> pickWeddingDate() async {
              final pickedDate = await showDatePicker(
                context: context,
                initialDate: selectedWeddingDate ?? DateTime.now(),
                firstDate: DateTime.now().subtract(const Duration(days: 365 * 2)),
                lastDate: DateTime.now().add(const Duration(days: 365 * 10)),
              );
              if (pickedDate != null) {
                setModalState(() {
                  selectedWeddingDate = pickedDate;
                  weddingDateController.text = _formatWeddingDate(pickedDate);
                });
              }
            }

            Future<void> saveProfile() async {
              setModalState(() => isSaving = true);
              try {
                await ref.read(authProvider.notifier).updateProfile({
                  'name': nameController.text.trim(),
                  'email': emailController.text.trim(),
                  'weddingDate': weddingDateController.text.trim(),
                  'partnerName': partnerNameController.text.trim(),
                  'city': cityController.text.trim(),
                });
                if (sheetContext.mounted) Navigator.of(sheetContext).pop(true);
              } catch (_) {
                setModalState(() => isSaving = false);
                if (sheetContext.mounted) {
                  ScaffoldMessenger.of(sheetContext).showSnackBar(
                    const SnackBar(content: Text('Unable to update profile right now. Please try again.')),
                  );
                }
              }
            }

            return SafeArea(
              child: Padding(
                padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(context).viewInsets.bottom + 24),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Container(
                          width: 42,
                          height: 4,
                          decoration: BoxDecoration(
                            color: AppColors.border,
                            borderRadius: BorderRadius.circular(999),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Edit Personal Details',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Keep your wedding profile up to date for better planning.',
                        style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                      ),
                      const SizedBox(height: 20),
                      TextField(
                        controller: nameController,
                        textCapitalization: TextCapitalization.words,
                        decoration: const InputDecoration(
                          labelText: 'Name',
                          prefixIcon: Icon(Icons.person_outline),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          labelText: 'Email',
                          prefixIcon: Icon(Icons.mail_outline),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: weddingDateController,
                        readOnly: true,
                        onTap: pickWeddingDate,
                        decoration: const InputDecoration(
                          labelText: 'Wedding Date',
                          prefixIcon: Icon(Icons.calendar_today_outlined),
                          suffixIcon: Icon(Icons.edit_calendar_outlined),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: partnerNameController,
                        textCapitalization: TextCapitalization.words,
                        decoration: const InputDecoration(
                          labelText: 'Partner Name',
                          prefixIcon: Icon(Icons.favorite_outline),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: cityController,
                        textCapitalization: TextCapitalization.words,
                        decoration: const InputDecoration(
                          labelText: 'City',
                          prefixIcon: Icon(Icons.location_on_outlined),
                        ),
                      ),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: isSaving ? null : () => Navigator.of(sheetContext).pop(false),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              ),
                              child: const Text('Cancel'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: isSaving ? null : saveProfile,
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              ),
                              child: isSaving
                                  ? const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                    )
                                  : const Text('Save Changes'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );

    nameController.dispose();
    emailController.dispose();
    weddingDateController.dispose();
    partnerNameController.dispose();
    cityController.dispose();

    if (updated == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated successfully.')),
      );
    }
  }

  void _showHelpSupportSheet() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 42,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Help & Support',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  'Reach the WeddingOS team whenever you need assistance.',
                  style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                ),
                const SizedBox(height: 16),
                _SupportOption(
                  icon: Icons.mail_outline,
                  title: 'Email Support',
                  subtitle: 'support@weddingos.in',
                  onTap: () {
                    Navigator.of(sheetContext).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Email us at support@weddingos.in')),
                    );
                  },
                ),
                _SupportOption(
                  icon: Icons.call_outlined,
                  title: 'Call Support',
                  subtitle: '+91 98765 43210',
                  onTap: () {
                    Navigator.of(sheetContext).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Call us at +91 98765 43210')),
                    );
                  },
                ),
                _SupportOption(
                  icon: Icons.help_center_outlined,
                  title: 'FAQs',
                  subtitle: 'help.weddingos.in/faqs',
                  onTap: () {
                    Navigator.of(sheetContext).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Visit help.weddingos.in/faqs for quick answers.')),
                    );
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showAboutWeddingOs() {
    showAboutDialog(
      context: context,
      applicationName: 'WeddingOS',
      applicationVersion: '1.0.0',
      applicationIcon: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: AppColors.brandLight,
          borderRadius: BorderRadius.circular(14),
        ),
        child: const Icon(Icons.favorite_outline, color: AppColors.brand),
      ),
      children: const [
        SizedBox(height: 8),
        Text(
          'WeddingOS helps couples discover trusted vendors, manage bookings, and track wedding plans in one place.',
        ),
        SizedBox(height: 12),
        SelectableText('Website: www.weddingos.in'),
        SelectableText('Support: support@weddingos.in'),
        SelectableText('FAQs: help.weddingos.in/faqs'),
      ],
    );
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
                  GestureDetector(
                    onTap: _showPersonalDetailsSheet,
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.edit, color: Colors.white, size: 18),
                    ),
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
            _MenuItem(icon: Icons.person_outline, title: 'Personal Details', subtitle: 'Name, email, wedding date', onTap: _showPersonalDetailsSheet),
            _MenuItem(icon: Icons.event_note, title: 'My Bookings', subtitle: 'View all your vendor bookings', onTap: () => context.go('/bookings')),
            _MenuItem(icon: Icons.favorite_border, title: 'Wishlist', subtitle: 'Saved vendors', onTap: () => context.go('/wishlist')),
            _MenuItem(icon: Icons.notifications_outlined, title: 'Notifications', subtitle: 'Booking updates & reminders', onTap: () => context.push('/notifications')),
            _MenuItem(icon: Icons.checklist, title: 'Wedding Checklist', subtitle: 'Track your wedding prep', onTap: () => context.push('/checklist')),
            _MenuItem(icon: Icons.chat_outlined, title: 'Messages', subtitle: 'Chat with vendors', onTap: () => context.go('/chat')),
            _MenuItem(icon: Icons.account_balance_wallet_outlined, title: 'Payments & Escrow', subtitle: 'Transaction history', onTap: () => context.go('/bookings')),
            _MenuItem(icon: Icons.help_outline, title: 'Help & Support', subtitle: 'FAQs, contact us', onTap: _showHelpSupportSheet),
            _MenuItem(icon: Icons.info_outline, title: 'About WeddingOS', subtitle: 'Version 1.0.0', onTap: _showAboutWeddingOs),

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

class _SupportOption extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  const _SupportOption({required this.icon, required this.title, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      contentPadding: EdgeInsets.zero,
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: AppColors.brandLight, borderRadius: BorderRadius.circular(10)),
        child: Icon(icon, color: AppColors.brand, size: 20),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
      subtitle: Text(subtitle, style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
      trailing: Icon(Icons.chevron_right, color: AppColors.textMuted, size: 20),
    );
  }
}
