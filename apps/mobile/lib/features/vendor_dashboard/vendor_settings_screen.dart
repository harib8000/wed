import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/theme.dart';
import '../../models/user.dart';
import '../../providers/auth_provider.dart';

class VendorSettingsScreen extends ConsumerStatefulWidget {
  const VendorSettingsScreen({super.key});

  @override
  ConsumerState<VendorSettingsScreen> createState() => _VendorSettingsScreenState();
}

class _VendorSettingsScreenState extends ConsumerState<VendorSettingsScreen> {
  static const Map<String, String> _notificationPreferenceKeys = {
    'newEnquiryAlerts': 'vendor_settings_new_enquiry_alerts',
    'bookingConfirmed': 'vendor_settings_booking_confirmed',
    'paymentUpdates': 'vendor_settings_payment_updates',
    'newReviews': 'vendor_settings_new_reviews',
    'marketingTips': 'vendor_settings_marketing_tips',
  };

  final Map<String, bool> _notificationPreferences = {
    'newEnquiryAlerts': true,
    'bookingConfirmed': true,
    'paymentUpdates': true,
    'newReviews': true,
    'marketingTips': false,
  };

  bool _didSeedProfile = false;
  String _businessName = 'Vendor';
  String _email = 'Not set';
  String _businessLocation = 'Not set';
  String _payoutSchedule = 'Weekly';
  TimeOfDay _businessStartTime = const TimeOfDay(hour: 9, minute: 0);
  TimeOfDay _businessEndTime = const TimeOfDay(hour: 21, minute: 0);
  bool _autoReplyEnabled = true;
  String _autoReplyMessage = 'Thanks for reaching out! We’ll get back to you shortly.';
  String _cancellationPolicy = 'Standard';
  List<String> _languagesSupported = const ['English', 'Hindi', 'Telugu'];
  String _appVersion = '1.0.0';

  @override
  void initState() {
    super.initState();
    _loadNotificationPreferences();
    _loadPackageInfo();
  }

  Future<void> _loadNotificationPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;

    setState(() {
      for (final entry in _notificationPreferenceKeys.entries) {
        _notificationPreferences[entry.key] = prefs.getBool(entry.value) ?? _notificationPreferences[entry.key] ?? false;
      }
    });
  }

  Future<void> _loadPackageInfo() async {
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      if (!mounted) return;

      setState(() {
        _appVersion = '${packageInfo.version} (${packageInfo.buildNumber})';
      });
    } catch (_) {
      // Keep the fallback version label if platform info is unavailable.
    }
  }

  void _seedProfile(User? user) {
    if (_didSeedProfile || user == null) return;

    _businessName = user.name ?? 'Vendor';
    _email = user.email ?? 'Not set';
    _businessLocation = user.city ?? 'Not set';
    _didSeedProfile = true;
  }

  String _formatBusinessHours(BuildContext context) {
    return '${_businessStartTime.format(context)} - ${_businessEndTime.format(context)}';
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
          behavior: SnackBarBehavior.floating,
          backgroundColor: AppColors.textPrimary,
        ),
      );
  }

  Future<String?> _showEditDialog({
    required String title,
    required String initialValue,
    required String hintText,
    TextInputType keyboardType = TextInputType.text,
    String? helperText,
    String? Function(String value)? validator,
    int maxLines = 1,
  }) async {
    final formKey = GlobalKey<FormState>();
    final controller = TextEditingController(text: initialValue == 'Not set' ? '' : initialValue);

    return showDialog<String>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(title),
          content: Form(
            key: formKey,
            child: TextFormField(
              controller: controller,
              keyboardType: keyboardType,
              maxLines: maxLines,
              decoration: InputDecoration(
                hintText: hintText,
                helperText: helperText,
              ),
              validator: (value) {
                final trimmed = value?.trim() ?? '';
                if (trimmed.isEmpty) {
                  return 'This field is required';
                }
                return validator?.call(trimmed);
              },
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                if (!(formKey.currentState?.validate() ?? false)) {
                  return;
                }
                Navigator.of(dialogContext).pop(controller.text.trim());
              },
              child: const Text('Save'),
            ),
          ],
        );
      },
    );
  }

  Future<String?> _showSelectionDialog({
    required String title,
    required List<String> options,
    required String currentValue,
  }) async {
    String selectedValue = currentValue;

    return showDialog<String>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Text(title),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: options
                    .map(
                      (option) => RadioListTile<String>(
                        contentPadding: EdgeInsets.zero,
                        activeColor: AppColors.brand,
                        title: Text(option),
                        value: option,
                        groupValue: selectedValue,
                        onChanged: (value) {
                          if (value == null) return;
                          setDialogState(() => selectedValue = value);
                        },
                      ),
                    )
                    .toList(),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.of(dialogContext).pop(selectedValue),
                  child: const Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _showInfoDialog({
    required String title,
    required String message,
  }) {
    return showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(title),
          content: Text(message),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Got it'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _toggleNotification(String key, bool value, String label) async {
    setState(() {
      _notificationPreferences[key] = value;
    });

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_notificationPreferenceKeys[key]!, value);

    if (!mounted) return;
    _showSnackBar('$label ${value ? 'enabled' : 'disabled'}.');
  }

  Future<void> _pickBusinessHours() async {
    final startTime = await showTimePicker(
      context: context,
      initialTime: _businessStartTime,
      helpText: 'Select opening time',
    );
    if (startTime == null || !mounted) return;

    final endTime = await showTimePicker(
      context: context,
      initialTime: _businessEndTime,
      helpText: 'Select closing time',
    );
    if (endTime == null || !mounted) return;

    setState(() {
      _businessStartTime = startTime;
      _businessEndTime = endTime;
    });
    _showSnackBar('Business hours updated.');
  }

  Future<void> _editAutoReplyMessage() async {
    final controller = TextEditingController(text: _autoReplyMessage);
    bool enabled = _autoReplyEnabled;

    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Auto-Reply Message'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    activeColor: AppColors.brand,
                    title: const Text('Enable auto-reply'),
                    value: enabled,
                    onChanged: (value) => setDialogState(() => enabled = value),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: controller,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      hintText: 'Type the message vendors should send automatically',
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () {
                    Navigator.of(dialogContext).pop({
                      'enabled': enabled,
                      'message': controller.text.trim().isEmpty
                          ? _autoReplyMessage
                          : controller.text.trim(),
                    });
                  },
                  child: const Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );

    if (result == null || !mounted) return;

    setState(() {
      _autoReplyEnabled = result['enabled'] as bool;
      _autoReplyMessage = result['message'] as String;
    });
    _showSnackBar(_autoReplyEnabled ? 'Auto-reply updated.' : 'Auto-reply disabled.');
  }

  Future<List<String>?> _showMultiSelectDialog({
    required String title,
    required List<String> options,
    required List<String> selectedOptions,
  }) async {
    final selected = {...selectedOptions};

    return showDialog<List<String>>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Text(title),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: options
                      .map(
                        (option) => CheckboxListTile(
                          value: selected.contains(option),
                          activeColor: AppColors.brand,
                          contentPadding: EdgeInsets.zero,
                          title: Text(option),
                          onChanged: (value) {
                            setDialogState(() {
                              if (value ?? false) {
                                selected.add(option);
                              } else {
                                selected.remove(option);
                              }
                            });
                          },
                        ),
                      )
                      .toList(),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.of(dialogContext).pop(selected.toList()..sort()),
                  child: const Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _showSupportSheet() async {
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Help & Support',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 12),
                const ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(Icons.email_outlined, color: AppColors.brand),
                  title: Text('support@weddingos.in'),
                  subtitle: Text('Email support'),
                ),
                const ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(Icons.phone_outlined, color: AppColors.brand),
                  title: Text('+91 98765 43210'),
                  subtitle: Text('Mon-Sat, 9 AM - 6 PM'),
                ),
                const ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(Icons.chat_bubble_outline, color: AppColors.brand),
                  title: Text('Live chat'),
                  subtitle: Text('Available in the next update'),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.of(sheetContext).pop(),
                    child: const Text('Close'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );

    if (!mounted) return;
    _showSnackBar('Support options shared.');
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    _seedProfile(user);

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
                icon: Icons.person_outline,
                label: 'Business Name',
                value: _businessName,
                onTap: () async {
                  final updatedValue = await _showEditDialog(
                    title: 'Edit Business Name',
                    initialValue: _businessName,
                    hintText: 'Enter your business name',
                  );
                  if (updatedValue == null || updatedValue == _businessName) return;
                  setState(() => _businessName = updatedValue);
                  _showSnackBar('Business name updated.');
                },
              ),
              _SettingsTile(
                icon: Icons.phone_outlined,
                label: 'Phone Number',
                value: user?.phone ?? '---',
                onTap: () async {
                  await _showInfoDialog(
                    title: 'Phone Number',
                    message: 'Your phone number is used for account security and cannot be changed here. Please contact WeddingOS support for help.',
                  );
                  _showSnackBar('Phone number changes are handled by support.');
                },
              ),
              _SettingsTile(
                icon: Icons.email_outlined,
                label: 'Email',
                value: _email,
                onTap: () async {
                  final updatedValue = await _showEditDialog(
                    title: 'Edit Email',
                    initialValue: _email,
                    hintText: 'Enter your business email',
                    keyboardType: TextInputType.emailAddress,
                    validator: (value) {
                      final emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
                      if (!emailRegex.hasMatch(value)) {
                        return 'Enter a valid email address';
                      }
                      return null;
                    },
                  );
                  if (updatedValue == null || updatedValue == _email) return;
                  setState(() => _email = updatedValue);
                  _showSnackBar('Email updated.');
                },
              ),
              _SettingsTile(
                icon: Icons.location_on_outlined,
                label: 'Business Location',
                value: _businessLocation,
                onTap: () async {
                  final updatedValue = await _showEditDialog(
                    title: 'Edit Business Location',
                    initialValue: _businessLocation,
                    hintText: 'Enter your business location',
                  );
                  if (updatedValue == null || updatedValue == _businessLocation) return;
                  setState(() => _businessLocation = updatedValue);
                  _showSnackBar('Business location updated.');
                },
              ),
            ]),

            const SizedBox(height: 16),

            // ─── Notifications ────────────────
            _SectionHeader(title: 'Notifications'),
            _SettingsCard(children: [
              _ToggleTile(
                icon: Icons.mail_outline,
                label: 'New Enquiry Alerts',
                value: _notificationPreferences['newEnquiryAlerts'] ?? true,
                onChanged: (value) => _toggleNotification('newEnquiryAlerts', value, 'New enquiry alerts'),
              ),
              _ToggleTile(
                icon: Icons.event_available,
                label: 'Booking Confirmed',
                value: _notificationPreferences['bookingConfirmed'] ?? true,
                onChanged: (value) => _toggleNotification('bookingConfirmed', value, 'Booking confirmed alerts'),
              ),
              _ToggleTile(
                icon: Icons.payment,
                label: 'Payment Updates',
                value: _notificationPreferences['paymentUpdates'] ?? true,
                onChanged: (value) => _toggleNotification('paymentUpdates', value, 'Payment updates'),
              ),
              _ToggleTile(
                icon: Icons.star_outline,
                label: 'New Reviews',
                value: _notificationPreferences['newReviews'] ?? true,
                onChanged: (value) => _toggleNotification('newReviews', value, 'New review alerts'),
              ),
              _ToggleTile(
                icon: Icons.campaign_outlined,
                label: 'Marketing & Tips',
                value: _notificationPreferences['marketingTips'] ?? false,
                onChanged: (value) => _toggleNotification('marketingTips', value, 'Marketing updates'),
              ),
            ]),

            const SizedBox(height: 16),

            // ─── Payment ──────────────────────
            _SectionHeader(title: 'Payment & Banking'),
            _SettingsCard(children: [
              _SettingsTile(
                icon: Icons.account_balance,
                label: 'Bank Account',
                value: 'HDFC ****4521',
                onTap: () async {
                  await _showInfoDialog(
                    title: 'Bank Account',
                    message: 'For security reasons, bank account changes are handled by WeddingOS support. Please contact the finance team to update payout details.',
                  );
                  _showSnackBar('Bank account changes require support assistance.');
                },
              ),
              _SettingsTile(
                icon: Icons.receipt_long,
                label: 'GST Number',
                value: '36AABCU9876H1Z2',
                onTap: () async {
                  await _showInfoDialog(
                    title: 'GST Number',
                    message: 'GST changes need compliance review. Please contact support with your updated registration details.',
                  );
                  _showSnackBar('GST updates are reviewed by support.');
                },
              ),
              _SettingsTile(
                icon: Icons.badge_outlined,
                label: 'PAN',
                value: 'ABCDE1234F',
                onTap: () async {
                  await _showInfoDialog(
                    title: 'PAN',
                    message: 'PAN details are locked for verification. Contact support if you need to update your tax information.',
                  );
                  _showSnackBar('PAN updates are handled by support.');
                },
              ),
              _SettingsTile(
                icon: Icons.schedule,
                label: 'Payout Schedule',
                value: _payoutSchedule,
                onTap: () async {
                  final selectedValue = await _showSelectionDialog(
                    title: 'Payout Schedule',
                    options: const ['Daily', 'Weekly', 'Bi-weekly', 'Monthly'],
                    currentValue: _payoutSchedule,
                  );
                  if (selectedValue == null || selectedValue == _payoutSchedule) return;
                  setState(() => _payoutSchedule = selectedValue);
                  _showSnackBar('Payout schedule updated to $selectedValue.');
                },
              ),
            ]),

            const SizedBox(height: 16),

            // ─── Business ─────────────────────
            _SectionHeader(title: 'Business Settings'),
            _SettingsCard(children: [
              _SettingsTile(
                icon: Icons.access_time,
                label: 'Business Hours',
                value: _formatBusinessHours(context),
                onTap: _pickBusinessHours,
              ),
              _SettingsTile(
                icon: Icons.auto_awesome,
                label: 'Auto-Reply Message',
                value: _autoReplyEnabled ? 'Enabled' : 'Disabled',
                onTap: _editAutoReplyMessage,
              ),
              _SettingsTile(
                icon: Icons.groups_outlined,
                label: 'Team Members',
                value: '3 members',
                onTap: () async {
                  await _showInfoDialog(
                    title: 'Team Members',
                    message: 'You currently have 3 team members on file. Advanced team management is coming soon in a future update.',
                  );
                  _showSnackBar('Team management is coming soon.');
                },
              ),
              _SettingsTile(
                icon: Icons.description_outlined,
                label: 'Cancellation Policy',
                value: _cancellationPolicy,
                onTap: () async {
                  final selectedValue = await _showSelectionDialog(
                    title: 'Cancellation Policy',
                    options: const ['Standard', 'Strict', 'Flexible'],
                    currentValue: _cancellationPolicy,
                  );
                  if (selectedValue == null || selectedValue == _cancellationPolicy) return;
                  setState(() => _cancellationPolicy = selectedValue);
                  _showSnackBar('Cancellation policy updated to $selectedValue.');
                },
              ),
              _SettingsTile(
                icon: Icons.language,
                label: 'Languages Supported',
                value: _languagesSupported.join(', '),
                onTap: () async {
                  final selectedValues = await _showMultiSelectDialog(
                    title: 'Languages Supported',
                    options: const ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Marathi'],
                    selectedOptions: _languagesSupported,
                  );
                  if (selectedValues == null) return;
                  setState(() => _languagesSupported = selectedValues);
                  _showSnackBar('Supported languages updated.');
                },
              ),
            ]),

            const SizedBox(height: 16),

            // ─── App ──────────────────────────
            _SectionHeader(title: 'App'),
            _SettingsCard(children: [
              _SettingsTile(
                icon: Icons.help_outline,
                label: 'Help & Support',
                onTap: _showSupportSheet,
              ),
              _SettingsTile(
                icon: Icons.policy_outlined,
                label: 'Privacy Policy',
                onTap: () {
                  _showSnackBar('Privacy Policy will open in a future update.');
                },
              ),
              _SettingsTile(
                icon: Icons.description_outlined,
                label: 'Terms of Service',
                onTap: () {
                  _showSnackBar('Terms of Service will open in a future update.');
                },
              ),
              _SettingsTile(
                icon: Icons.info_outline,
                label: 'App Version',
                value: _appVersion,
                onTap: () async {
                  _showSnackBar('Viewing app version details.');
                  showAboutDialog(
                    context: context,
                    applicationName: 'WeddingOS Vendor',
                    applicationVersion: _appVersion,
                    applicationLegalese: '© 2026 WeddingOS',
                    children: const [
                      Text('Manage your storefront, bookings, and vendor operations from one place.'),
                    ],
                  );
                },
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
