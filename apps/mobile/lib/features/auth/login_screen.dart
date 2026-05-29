import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';

// ─── Role Configuration ────────────────────────────────────────────────────────

class _RoleConfig {
  final String key;
  final String label;
  final String title;
  final String subtitle;
  final String tagline;
  final String demoName;
  final String demoSubtitle;
  final IconData icon;
  final IconData illustrationIcon;
  final Color color;
  final Color bgGradientStart;
  final Color bgGradientEnd;
  final void Function(WidgetRef ref, BuildContext context) onDemoLogin;

  const _RoleConfig({
    required this.key,
    required this.label,
    required this.title,
    required this.subtitle,
    required this.tagline,
    required this.demoName,
    required this.demoSubtitle,
    required this.icon,
    required this.illustrationIcon,
    required this.color,
    required this.bgGradientStart,
    required this.bgGradientEnd,
    required this.onDemoLogin,
  });
}

final _roles = [
  _RoleConfig(
    key: 'customer',
    label: 'Couple / Customer',
    title: 'Couple Sign In',
    subtitle: 'Plan your dream wedding with verified vendors',
    tagline: 'Plan · Book · Celebrate',
    demoName: 'Demo Couple Login',
    demoSubtitle: 'Browse vendors, book & pay',
    icon: Icons.favorite,
    illustrationIcon: Icons.favorite_rounded,
    color: const Color(0xFFDB2777),
    bgGradientStart: const Color(0xFFFDF2F8),
    bgGradientEnd: const Color(0xFFFCE7F3),
    onDemoLogin: (ref, ctx) {
      ref.read(authProvider.notifier).demoCustomerLogin();
      ctx.go('/');
    },
  ),
  _RoleConfig(
    key: 'vendor',
    label: 'Vendor / Seller',
    title: 'Vendor Sign In',
    subtitle: 'Manage bookings, packages & grow your business',
    tagline: 'List · Manage · Grow',
    demoName: 'Demo Vendor Login',
    demoSubtitle: 'Manage bookings & services',
    icon: Icons.storefront,
    illustrationIcon: Icons.camera_alt_rounded,
    color: const Color(0xFF059669),
    bgGradientStart: const Color(0xFFECFDF5),
    bgGradientEnd: const Color(0xFFD1FAE5),
    onDemoLogin: (ref, ctx) {
      ref.read(authProvider.notifier).demoVendorLogin();
      ctx.go('/');
    },
  ),
  _RoleConfig(
    key: 'coordinator',
    label: 'Wedding Coordinator',
    title: 'Coordinator Sign In',
    subtitle: 'Manage timelines, tasks & vendor coordination',
    tagline: 'Organize · Coordinate · Execute',
    demoName: 'Demo Coordinator Login',
    demoSubtitle: 'Manage events & timelines',
    icon: Icons.groups,
    illustrationIcon: Icons.assignment_rounded,
    color: const Color(0xFF4F46E5),
    bgGradientStart: const Color(0xFFEEF2FF),
    bgGradientEnd: const Color(0xFFE0E7FF),
    onDemoLogin: (ref, ctx) {
      ref.read(authProvider.notifier).demoCoordinatorLogin();
      ctx.go('/coordinator/dashboard');
    },
  ),
  _RoleConfig(
    key: 'admin',
    label: 'Platform Admin',
    title: 'Admin Sign In',
    subtitle: 'Vendor verification, disputes & platform analytics',
    tagline: 'Verify · Monitor · Manage',
    demoName: 'Demo Admin Login',
    demoSubtitle: 'Platform administration',
    icon: Icons.shield,
    illustrationIcon: Icons.dashboard_rounded,
    color: const Color(0xFFD97706),
    bgGradientStart: const Color(0xFFFEF3C7),
    bgGradientEnd: const Color(0xFFFDE68A),
    onDemoLogin: (ref, ctx) {
      ref.read(authProvider.notifier).demoAdminLogin();
      ctx.go('/admin/dashboard');
    },
  ),
];

// ─── Login Screen (Role Selection → OTP Flow) ──────────────────────────────────

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen>
    with TickerProviderStateMixin {
  _RoleConfig? _selectedRole;
  final _phoneController = TextEditingController();
  final _otpControllers = List.generate(6, (_) => TextEditingController());
  final _otpFocusNodes = List.generate(6, (_) => FocusNode());

  bool _isOtpStep = false;
  bool _isLoading = false;
  int _resendTimer = 0;
  Timer? _timer;
  String? _errorMsg;

  // Biometric auth support
  final _localAuth = LocalAuthentication();
  bool _biometricAvailable = false;

  // Staggered card entrance animations
  late final AnimationController _staggerController;
  late final List<Animation<double>> _cardAnimations;

  @override
  void initState() {
    super.initState();
    _checkBiometrics();
    _staggerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _cardAnimations = List.generate(_roles.length, (i) {
      final start = i * 0.15;
      final end = start + 0.4;
      return CurvedAnimation(
        parent: _staggerController,
        curve: Interval(start.clamp(0.0, 1.0), end.clamp(0.0, 1.0),
            curve: Curves.easeOutCubic),
      );
    });
    _staggerController.forward();
  }

  Future<void> _checkBiometrics() async {
    try {
      final canCheck = await _localAuth.canCheckBiometrics;
      final isDeviceSupported = await _localAuth.isDeviceSupported();
      final prefs = await SharedPreferences.getInstance();
      final enabled = prefs.getBool('biometric_enabled') ?? false;
      if (mounted) {
        setState(() => _biometricAvailable = canCheck && isDeviceSupported && enabled);
      }
      // If biometric is enabled, attempt immediate authentication
      if (canCheck && isDeviceSupported && enabled) {
        _authenticateWithBiometrics();
      }
    } catch (_) {}
  }

  Future<void> _authenticateWithBiometrics() async {
    try {
      final authenticated = await _localAuth.authenticate(
        localizedReason: 'Sign in to WeddingOS',
        options: const AuthenticationOptions(stickyAuth: true, biometricOnly: true),
      );
      if (authenticated && mounted) {
        // Trigger a silent re-auth using saved tokens (handled by AuthNotifier._init)
        await ref.read(authProvider.notifier).refreshFromStorage();
        if (mounted && ref.read(authProvider).isAuthenticated) {
          final role = ref.read(authProvider).user?.role ?? 'CUSTOMER';
          context.go(_homeForRole(role));
        }
      }
    } catch (_) {}
  }

  String get _phone => _phoneController.text.replaceAll(' ', '').trim();
  String get _otp => _otpControllers.map((c) => c.text).join();

  String _homeForRole(String role) {
    switch (role) {
      case 'VENDOR':
        return '/vendor/dashboard';
      case 'COORDINATOR':
        return '/coordinator/dashboard';
      case 'ADMIN':
        return '/admin/dashboard';
      default:
        return '/';
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _staggerController.dispose();
    _phoneController.dispose();
    for (final c in _otpControllers) {
      c.dispose();
    }
    for (final f in _otpFocusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  void _goBack() {
    if (_isOtpStep) {
      setState(() {
        _isOtpStep = false;
        _errorMsg = null;
        for (final c in _otpControllers) {
          c.clear();
        }
      });
    } else if (_selectedRole != null) {
      setState(() {
        _selectedRole = null;
        _phoneController.clear();
        _errorMsg = null;
      });
    }
  }

  void _sendOtp() async {
    if (_phone.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid 10-digit phone number')),
      );
      return;
    }
    setState(() {
      _isLoading = true;
      _errorMsg = null;
    });
    try {
      await ref.read(authProvider.notifier).sendOtp(_phone);
      if (!mounted) return;
      setState(() {
        _isOtpStep = true;
        _isLoading = false;
        _resendTimer = 30;
      });
      _startResendTimer();
      _otpFocusNodes[0].requestFocus();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMsg = 'Could not send OTP. Please try again.';
      });
    }
  }

  void _startResendTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      setState(() => _resendTimer--);
      if (_resendTimer <= 0) t.cancel();
    });
  }

  void _verifyOtp() async {
    if (_otp.length < 6) return;
    setState(() {
      _isLoading = true;
      _errorMsg = null;
    });
    try {
      await ref.read(authProvider.notifier).verifyOtp(_phone, _otp);
      if (!mounted) return;
      final role = ref.read(authProvider).user?.role ?? 'CUSTOMER';
      setState(() => _isLoading = false);
      context.go(_homeForRole(role));
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMsg = 'Invalid OTP. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // If no role selected, show role selection
    if (_selectedRole == null) {
      return _buildRoleSelection();
    }
    // Show OTP login for the selected role
    return _buildRoleLogin(_selectedRole!);
  }

  // ─── Role Selection Screen ────────────────────────────────────────────────────

  Widget _buildRoleSelection() {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 32),

              // Logo
              Center(
                child: Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [AppColors.brand, Color(0xFF9333EA)]),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [BoxShadow(color: AppColors.brand.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 8))],
                  ),
                  child: const Center(child: Text('W', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 32))),
                ),
              ),
              const SizedBox(height: 24),

              // Title
              Text(
                'Welcome to\nWedding OS',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Choose how you\'d like to sign in',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textMuted, fontSize: 14, height: 1.5),
              ),
              const SizedBox(height: 28),

              // ─── Illustrated Role Cards ─────────────────────
              ...List.generate(_roles.length, (i) {
                final role = _roles[i];
                return AnimatedBuilder(
                  animation: _cardAnimations[i],
                  builder: (context, child) {
                    return Transform.translate(
                      offset: Offset(0, 30 * (1 - _cardAnimations[i].value)),
                      child: Opacity(
                        opacity: _cardAnimations[i].value,
                        child: child,
                      ),
                    );
                  },
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: _IllustratedRoleCard(
                      config: role,
                      onTap: () {
                        HapticFeedback.lightImpact();
                        setState(() => _selectedRole = role);
                      },
                    ),
                  ),
                );
              }),

              const SizedBox(height: 20),

              // ─── Demo Divider ───────────────────
              Row(
                children: [
                  Expanded(child: Divider(color: AppColors.border)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text('Quick Demo Access', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  ),
                  Expanded(child: Divider(color: AppColors.border)),
                ],
              ),
              const SizedBox(height: 16),

              // ─── Demo Login Buttons ─────────────
              ..._roles.map((role) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _DemoButton(
                  icon: role.icon,
                  label: role.demoName,
                  subtitle: role.demoSubtitle,
                  color: role.color,
                  onTap: () {
                    HapticFeedback.mediumImpact();
                    role.onDemoLogin(ref, context);
                  },
                ),
              )),

              const SizedBox(height: 20),

              // Trust badges
              Row(
                children: [
                  Expanded(child: Divider(color: AppColors.border)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text('Why Wedding OS?', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  ),
                  Expanded(child: Divider(color: AppColors.border)),
                ],
              ),
              const SizedBox(height: 16),
              _TrustBadge(icon: Icons.verified_user, title: '100% Verified Vendors', subtitle: 'Every vendor is background-checked'),
              const SizedBox(height: 10),
              _TrustBadge(icon: Icons.account_balance_wallet, title: 'Escrow Payments', subtitle: 'Pay only when satisfied with the work'),
              const SizedBox(height: 10),
              _TrustBadge(icon: Icons.support_agent, title: 'Dedicated Support', subtitle: '24/7 planning assistance for your wedding'),

              const SizedBox(height: 24),

              // Branded tagline
              Center(
                child: Text(
                  '✨ Connecting Dreams to Celebrations ✨',
                  style: TextStyle(
                    color: AppColors.brand.withOpacity(0.7),
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Role-Specific Login Screen ───────────────────────────────────────────────

  Widget _buildRoleLogin(_RoleConfig role) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 16),

              // Back button
              Align(
                alignment: Alignment.centerLeft,
                child: GestureDetector(
                  onTap: _goBack,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.arrow_back_ios, size: 14, color: AppColors.textSecondary),
                        const SizedBox(width: 4),
                        Text(
                          _isOtpStep ? 'Change Number' : 'All Logins',
                          style: TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Role icon + branding
              Center(
                child: Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: role.color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Icon(role.icon, color: role.color, size: 30),
                ),
              ),
              const SizedBox(height: 16),

              // Role badge
              Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: role.color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(role.icon, size: 14, color: role.color),
                      const SizedBox(width: 6),
                      Text(
                        '${role.label} Login',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: role.color),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Title
              Text(
                _isOtpStep ? 'Verify OTP' : role.title,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                _isOtpStep
                    ? 'Enter the 6-digit code sent to +91 $_phone'
                    : role.subtitle,
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textMuted, fontSize: 14, height: 1.5),
              ),
              const SizedBox(height: 32),

              // ─── Phone Step ────────────
              if (!_isOtpStep) ...[
                _buildPhoneInput(),
                const SizedBox(height: 12),
                if (_errorMsg != null)
                  Text(_errorMsg!, style: const TextStyle(color: AppColors.error, fontSize: 13), textAlign: TextAlign.center),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: _isLoading ? null : _sendOtp,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: role.color,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Send OTP', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ],

              // ─── OTP Step ──────────────
              if (_isOtpStep) ...[
                _buildOtpInput(),
                if (_errorMsg != null) ...[
                  const SizedBox(height: 12),
                  Text(_errorMsg!, style: const TextStyle(color: AppColors.error, fontSize: 13), textAlign: TextAlign.center),
                ],
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _isLoading ? null : _verifyOtp,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: role.color,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Verify & Login', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
                const SizedBox(height: 16),
                Center(
                  child: _resendTimer > 0
                      ? Text('Resend OTP in ${_resendTimer}s', style: TextStyle(color: AppColors.textMuted, fontSize: 13))
                      : TextButton(
                          onPressed: () {
                            _resendTimer = 30;
                            _startResendTimer();
                          },
                          child: const Text('Resend OTP'),
                        ),
                ),
              ],

              const SizedBox(height: 32),

              // ─── Demo Login for this role ───────
              Row(
                children: [
                  Expanded(child: Divider(color: AppColors.border)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text('Quick Demo', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  ),
                  Expanded(child: Divider(color: AppColors.border)),
                ],
              ),
              const SizedBox(height: 12),
              _DemoButton(
                icon: role.icon,
                label: role.demoName,
                subtitle: role.demoSubtitle,
                color: role.color,
                onTap: () => role.onDemoLogin(ref, context),
              ),

              const SizedBox(height: 20),

              // ─── Other role links ───────────────
              Center(
                child: Wrap(
                  spacing: 8,
                  children: _roles
                      .where((r) => r.key != role.key)
                      .map((r) => TextButton(
                            onPressed: () => setState(() {
                              _selectedRole = r;
                              _isOtpStep = false;
                              _phoneController.clear();
                              _errorMsg = null;
                              for (final c in _otpControllers) {
                                c.clear();
                              }
                            }),
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            ),
                            child: Text(
                              '${r.label} →',
                              style: TextStyle(fontSize: 12, color: r.color, fontWeight: FontWeight.w600),
                            ),
                          ))
                      .toList(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPhoneInput() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(border: Border(right: BorderSide(color: AppColors.border))),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('🇮🇳', style: TextStyle(fontSize: 18)),
                const SizedBox(width: 6),
                const Text('+91', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
              ],
            ),
          ),
          Expanded(
            child: TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9 ]')), LengthLimitingTextInputFormatter(11), _PhoneNumberFormatter()],
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500, letterSpacing: 1.5),
              decoration: const InputDecoration(
                hintText: '98765 43210',
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOtpInput() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(6, (i) {
            return Container(
              width: 48,
              height: 56,
              margin: EdgeInsets.only(right: i < 5 ? 8 : 0),
              child: TextField(
                controller: _otpControllers[i],
                focusNode: _otpFocusNodes[i],
                keyboardType: TextInputType.number,
                textAlign: TextAlign.center,
                maxLength: 1,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                decoration: InputDecoration(
                  counterText: '',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.border)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: _selectedRole?.color ?? AppColors.brand, width: 2)),
                  filled: true,
                  fillColor: _otpControllers[i].text.isNotEmpty
                      ? (_selectedRole?.color ?? AppColors.brand).withOpacity(0.05)
                      : Colors.white,
                ),
                onChanged: (v) {
                  HapticFeedback.selectionClick();
                  if (v.isNotEmpty && i < 5) _otpFocusNodes[i + 1].requestFocus();
                  if (v.isEmpty && i > 0) _otpFocusNodes[i - 1].requestFocus();
                  setState(() {}); // Update fill color
                  if (_otp.length == 6) {
                    HapticFeedback.mediumImpact();
                    _verifyOtp();
                  }
                },
              ),
            );
          }),
        ),
        const SizedBox(height: 12),
        // Paste OTP button
        TextButton.icon(
          onPressed: _pasteOtp,
          icon: Icon(Icons.content_paste, size: 16, color: AppColors.textMuted),
          label: Text('Paste OTP', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
        ),
      ],
    );
  }

  Future<void> _pasteOtp() async {
    final data = await Clipboard.getData(Clipboard.kTextPlain);
    if (data?.text == null) return;
    final digits = data!.text!.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.length < 6) return;
    for (int i = 0; i < 6; i++) {
      _otpControllers[i].text = digits[i];
    }
    HapticFeedback.mediumImpact();
    setState(() {});
    _verifyOtp();
  }
}

// ─── Illustrated Role Card Widget (Full-Width with Illustration) ────────────

class _IllustratedRoleCard extends StatelessWidget {
  final _RoleConfig config;
  final VoidCallback onTap;
  const _IllustratedRoleCard({required this.config, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [config.bgGradientStart, config.bgGradientEnd],
            ),
            border: Border.all(color: config.color.withOpacity(0.15)),
            boxShadow: [
              BoxShadow(
                color: config.color.withOpacity(0.08),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            children: [
              // Illustration circle
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: config.color.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Icon(config.illustrationIcon, color: config.color.withOpacity(0.3), size: 40),
                    Icon(config.icon, color: config.color, size: 28),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      config.label,
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: config.color),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      config.subtitle,
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: config.color.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        config.tagline,
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: config.color),
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.arrow_forward_ios, size: 16, color: config.color.withOpacity(0.6)),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Demo Button Widget ─────────────────────────────────────────────────────────

class _DemoButton extends StatelessWidget {
  final IconData icon;
  final String label, subtitle;
  final Color color;
  final VoidCallback onTap;
  const _DemoButton({required this.icon, required this.label, required this.subtitle, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color.withOpacity(0.06),
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: color.withOpacity(0.2)),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: color)),
                    const SizedBox(height: 1),
                    Text(subtitle, style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  ],
                ),
              ),
              // Quick-access badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF22C55E).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.bolt, size: 12, color: const Color(0xFF22C55E)),
                    const SizedBox(width: 2),
                    Text('Demo', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF22C55E))),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Trust Badge Widget ─────────────────────────────────────────────────────────

class _TrustBadge extends StatelessWidget {
  final IconData icon;
  final String title, subtitle;
  const _TrustBadge({required this.icon, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.brandLight.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: AppColors.brandLight, borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: AppColors.brand, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                Text(subtitle, style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Phone Number Formatter (98765 43210) ───────────────────────────────────────

class _PhoneNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final digits = newValue.text.replaceAll(' ', '');
    if (digits.length <= 5) return newValue;

    final formatted = '${digits.substring(0, 5)} ${digits.substring(5)}';
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}
