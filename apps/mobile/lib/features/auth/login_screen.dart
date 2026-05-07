import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneController = TextEditingController();
  final _otpControllers = List.generate(6, (_) => TextEditingController());
  final _otpFocusNodes = List.generate(6, (_) => FocusNode());

  bool _isOtpStep = false;
  bool _isLoading = false;
  int _resendTimer = 0;

  String get _phone => _phoneController.text.trim();
  String get _otp => _otpControllers.map((c) => c.text).join();

  @override
  void dispose() {
    _phoneController.dispose();
    for (final c in _otpControllers) c.dispose();
    for (final f in _otpFocusNodes) f.dispose();
    super.dispose();
  }

  void _sendOtp() {
    if (_phone.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter a valid 10-digit phone number')));
      return;
    }
    setState(() {
      _isOtpStep = true;
      _resendTimer = 30;
    });
    _startResendTimer();
    _otpFocusNodes[0].requestFocus();
  }

  void _startResendTimer() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) return false;
      setState(() => _resendTimer--);
      return _resendTimer > 0;
    });
  }

  void _verifyOtp() async {
    if (_otp.length < 6) return;
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(seconds: 1)); // Simulate API call
    if (!mounted) return;
    setState(() => _isLoading = false);
    context.go('/');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 48),

              // ─── Logo ──────────────────
              Center(
                child: Container(
                  width: 72, height: 72,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [AppColors.brand, Color(0xFF9333EA)]),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [BoxShadow(color: AppColors.brand.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 8))],
                  ),
                  child: const Center(child: Text('W', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 32))),
                ),
              ),
              const SizedBox(height: 24),

              // ─── Title ─────────────────
              Text(
                _isOtpStep ? 'Verify OTP' : 'Welcome to\nWedding OS',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                _isOtpStep ? 'Enter the 6-digit code sent to +91 $_phone' : 'Plan your perfect wedding.\nBook trusted vendors with escrow protection.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textMuted, fontSize: 14, height: 1.5),
              ),
              const SizedBox(height: 40),

              // ─── Phone Step ────────────
              if (!_isOtpStep) ...[
                _buildPhoneInput(),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _sendOtp,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.brand, foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: const Text('Send OTP', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ],

              // ─── OTP Step ──────────────
              if (_isOtpStep) ...[
                _buildOtpInput(),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _isLoading ? null : _verifyOtp,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.brand, foregroundColor: Colors.white,
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
                const SizedBox(height: 8),
                Center(
                  child: TextButton(
                    onPressed: () => setState(() => _isOtpStep = false),
                    child: Text('Change Number', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                  ),
                ),
              ],

              const SizedBox(height: 40),

              // ─── Divider ───────────────
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
              const SizedBox(height: 20),

              // ─── Trust badges ──────────
              _TrustBadge(icon: Icons.verified_user, title: '100% Verified Vendors', subtitle: 'Every vendor is background-checked'),
              const SizedBox(height: 12),
              _TrustBadge(icon: Icons.account_balance_wallet, title: 'Escrow Payments', subtitle: 'Pay only when satisfied with the work'),
              const SizedBox(height: 12),
              _TrustBadge(icon: Icons.support_agent, title: 'Dedicated Support', subtitle: '24/7 planning assistance for your wedding'),
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
            child: const Text('+91', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
          ),
          Expanded(
            child: TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(10)],
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500, letterSpacing: 1),
              decoration: const InputDecoration(
                hintText: 'Enter phone number',
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
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(6, (i) {
        return Container(
          width: 48, height: 56,
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
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.brand, width: 2)),
            ),
            onChanged: (v) {
              if (v.isNotEmpty && i < 5) _otpFocusNodes[i + 1].requestFocus();
              if (v.isEmpty && i > 0) _otpFocusNodes[i - 1].requestFocus();
              if (_otp.length == 6) _verifyOtp();
            },
          ),
        );
      }),
    );
  }
}

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
