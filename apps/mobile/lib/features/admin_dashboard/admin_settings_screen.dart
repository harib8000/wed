import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';

class AdminSettingsScreen extends ConsumerStatefulWidget {
  const AdminSettingsScreen({super.key});

  @override
  ConsumerState<AdminSettingsScreen> createState() => _AdminSettingsScreenState();
}

class _AdminSettingsScreenState extends ConsumerState<AdminSettingsScreen> {
  String _appVersion = '';
  bool _aiRecommendationsEnabled = true;
  bool _newRegistrationsEnabled = true;
  bool _maintenanceMode = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final info = await PackageInfo.fromPlatform();
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() {
        _appVersion = '${info.version} (${info.buildNumber})';
        _aiRecommendationsEnabled = prefs.getBool('admin_ai_enabled') ?? true;
        _newRegistrationsEnabled = prefs.getBool('admin_registrations_enabled') ?? true;
        _maintenanceMode = prefs.getBool('admin_maintenance_mode') ?? false;
      });
    }
  }

  Future<void> _toggleSetting(String key, bool val, void Function(bool) setter) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(key, val);
    if (mounted) setState(() => setter(val));
  }

  Future<void> _showBroadcastDialog() async {
    final titleCtrl = TextEditingController();
    final bodyCtrl = TextEditingController();
    String? targetRole;

    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Broadcast Notification'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleCtrl,
              decoration: const InputDecoration(labelText: 'Title', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: bodyCtrl,
              decoration: const InputDecoration(labelText: 'Message', border: OutlineInputBorder()),
              maxLines: 3,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(labelText: 'Target (optional)', border: OutlineInputBorder()),
              items: const [
                DropdownMenuItem(value: null, child: Text('All Users')),
                DropdownMenuItem(value: 'CUSTOMER', child: Text('Customers')),
                DropdownMenuItem(value: 'VENDOR', child: Text('Vendors')),
                DropdownMenuItem(value: 'COORDINATOR', child: Text('Coordinators')),
              ],
              onChanged: (v) => targetRole = v,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.admin, foregroundColor: Colors.white),
            onPressed: () async {
              if (titleCtrl.text.trim().isEmpty || bodyCtrl.text.trim().isEmpty) return;
              Navigator.of(ctx).pop();
              try {
                await ApiClient.broadcastNotification(
                  title: titleCtrl.text.trim(),
                  body: bodyCtrl.text.trim(),
                  targetRole: targetRole,
                );
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Notification broadcast sent!')),
                  );
                }
              } catch (_) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Failed to send broadcast.')),
                  );
                }
              }
            },
            child: const Text('Send'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final themeMode = ref.watch(themeModeProvider);
    final isDark = themeMode == ThemeMode.dark;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: AppColors.admin,
        foregroundColor: Colors.white,
        titleTextStyle: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
      ),
      body: ListView(
        children: [
          // Profile header
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: AppColors.adminLight,
                  child: Text(
                    (user?.name?.isNotEmpty == true) ? user!.name![0].toUpperCase() : 'A',
                    style: const TextStyle(
                        color: AppColors.admin, fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.name ?? 'Admin',
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                      Text(user?.email ?? 'Platform Administrator',
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                      if (user?.adminLevel != null)
                        Text('Admin Level ${user!.adminLevel}',
                            style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    ],
                  ),
                ),
              ],
            ),
          ),

          _Section(
            title: 'Platform Features',
            children: [
              SwitchListTile(
                value: _aiRecommendationsEnabled,
                activeColor: AppColors.admin,
                title: const Text('AI Recommendations'),
                subtitle: const Text('Enable AI-powered vendor suggestions'),
                onChanged: (v) => _toggleSetting('admin_ai_enabled', v, (b) => _aiRecommendationsEnabled = b),
              ),
              SwitchListTile(
                value: _newRegistrationsEnabled,
                activeColor: AppColors.admin,
                title: const Text('New Registrations'),
                subtitle: const Text('Allow new user and vendor signups'),
                onChanged: (v) => _toggleSetting('admin_registrations_enabled', v, (b) => _newRegistrationsEnabled = b),
              ),
              SwitchListTile(
                value: _maintenanceMode,
                activeColor: AppColors.error,
                title: const Text('Maintenance Mode'),
                subtitle: const Text('Show maintenance page to users'),
                onChanged: (v) => _toggleSetting('admin_maintenance_mode', v, (b) => _maintenanceMode = b),
              ),
            ],
          ),

          _Section(
            title: 'Notifications',
            children: [
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.admin.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.campaign_outlined, color: AppColors.admin, size: 18),
                ),
                title: const Text('Broadcast Notification'),
                subtitle: const Text('Send push notification to users'),
                trailing: const Icon(Icons.chevron_right),
                onTap: _showBroadcastDialog,
              ),
            ],
          ),

          _Section(
            title: 'Appearance',
            children: [
              SwitchListTile(
                value: isDark,
                activeColor: AppColors.admin,
                title: const Text('Dark Mode'),
                subtitle: const Text('Switch to dark theme'),
                onChanged: (_) => ref.read(themeModeProvider.notifier).toggle(),
              ),
            ],
          ),

          _Section(
            title: 'About',
            children: [
              ListTile(
                leading: const Icon(Icons.info_outline, color: AppColors.textSecondary),
                title: const Text('App Version'),
                trailing: Text(_appVersion, style: const TextStyle(color: AppColors.textMuted)),
              ),
            ],
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: OutlinedButton.icon(
              onPressed: () => ref.read(authProvider.notifier).logout(),
              icon: const Icon(Icons.logout, color: AppColors.error),
              label: const Text('Sign Out', style: TextStyle(color: AppColors.error)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.error),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _Section({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 6),
          child: Text(
            title,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700,
                color: AppColors.textSecondary, letterSpacing: 0.5),
          ),
        ),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(children: children),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}
