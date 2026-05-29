import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';

class CoordinatorProfileScreen extends ConsumerStatefulWidget {
  const CoordinatorProfileScreen({super.key});

  @override
  ConsumerState<CoordinatorProfileScreen> createState() => _CoordinatorProfileScreenState();
}

class _CoordinatorProfileScreenState extends ConsumerState<CoordinatorProfileScreen> {
  bool _biometricEnabled = false;
  bool _taskNotifications = true;
  bool _milestoneNotifications = true;
  bool _vendorMessages = true;
  final _localAuth = LocalAuthentication();

  @override
  void initState() {
    super.initState();
    _loadPrefs();
  }

  Future<void> _loadPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() {
        _biometricEnabled = prefs.getBool('biometric_enabled') ?? false;
        _taskNotifications = prefs.getBool('coord_task_notifications') ?? true;
        _milestoneNotifications = prefs.getBool('coord_milestone_notifications') ?? true;
        _vendorMessages = prefs.getBool('coord_vendor_messages') ?? true;
      });
    }
  }

  Future<void> _toggleBiometric(bool val) async {
    if (val) {
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

  Future<void> _togglePref(String key, bool val, void Function(bool) setter) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(key, val);
    if (mounted) setState(() => setter(val));
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final themeMode = ref.watch(themeModeProvider);
    final isDark = themeMode == ThemeMode.dark;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: 160,
            backgroundColor: AppColors.coordinator,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 32,
                          backgroundColor: Colors.white.withOpacity(0.2),
                          child: Text(
                            (user?.name?.isNotEmpty == true)
                                ? user!.name![0].toUpperCase()
                                : 'C',
                            style: const TextStyle(
                                color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                user?.name ?? 'Coordinator',
                                style: const TextStyle(
                                    color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 4),
                              if (user?.organizationName != null)
                                Text(user!.organizationName!,
                                    style: const TextStyle(color: Colors.white70, fontSize: 13)),
                              Text(user?.city ?? '',
                                  style: const TextStyle(color: Colors.white60, fontSize: 12)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          SliverList(
            delegate: SliverChildListDelegate([
              const SizedBox(height: 16),

              _Section(
                title: 'Account',
                children: [
                  _InfoTile(
                      icon: Icons.phone_outlined, label: 'Phone', value: user?.phone ?? ''),
                  _InfoTile(
                      icon: Icons.email_outlined,
                      label: 'Email',
                      value: user?.email ?? 'Not set'),
                  _InfoTile(
                      icon: Icons.location_city_outlined,
                      label: 'City',
                      value: user?.city ?? 'Not set'),
                  if (user?.organizationName != null)
                    _InfoTile(
                        icon: Icons.business_outlined,
                        label: 'Organization',
                        value: user!.organizationName!),
                  if (user?.assignedEventIds != null)
                    _InfoTile(
                        icon: Icons.event_outlined,
                        label: 'Assigned Events',
                        value: '${user!.assignedEventIds!.length}'),
                  if (user?.completedEventsCount != null)
                    _InfoTile(
                        icon: Icons.check_circle_outline,
                        label: 'Events Completed',
                        value: '${user!.completedEventsCount}'),
                ],
              ),

              _Section(
                title: 'Notifications',
                children: [
                  SwitchListTile(
                    value: _taskNotifications,
                    activeColor: AppColors.coordinator,
                    title: const Text('Task Assigned'),
                    subtitle: const Text('Alert when a task is assigned to you'),
                    onChanged: (v) => _togglePref('coord_task_notifications', v, (b) => _taskNotifications = b),
                  ),
                  SwitchListTile(
                    value: _milestoneNotifications,
                    activeColor: AppColors.coordinator,
                    title: const Text('Milestone Due'),
                    subtitle: const Text('Upcoming timeline milestone alerts'),
                    onChanged: (v) => _togglePref('coord_milestone_notifications', v, (b) => _milestoneNotifications = b),
                  ),
                  SwitchListTile(
                    value: _vendorMessages,
                    activeColor: AppColors.coordinator,
                    title: const Text('Vendor Messages'),
                    subtitle: const Text('New messages from vendors'),
                    onChanged: (v) => _togglePref('coord_vendor_messages', v, (b) => _vendorMessages = b),
                  ),
                ],
              ),

              _Section(
                title: 'Security',
                children: [
                  SwitchListTile(
                    value: _biometricEnabled,
                    activeColor: AppColors.coordinator,
                    title: const Text('Biometric Sign-In'),
                    subtitle: const Text('Use fingerprint or face ID to sign in'),
                    onChanged: _toggleBiometric,
                  ),
                ],
              ),

              _Section(
                title: 'Appearance',
                children: [
                  SwitchListTile(
                    value: isDark,
                    activeColor: AppColors.coordinator,
                    title: const Text('Dark Mode'),
                    subtitle: const Text('Switch to dark theme'),
                    onChanged: (v) =>
                        ref.read(themeModeProvider.notifier).toggle(),
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
            ]),
          ),
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

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoTile({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.coordinator, size: 20),
      title: Text(label, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
      subtitle: Text(value, style: const TextStyle(fontSize: 14, color: AppColors.textPrimary)),
    );
  }
}
