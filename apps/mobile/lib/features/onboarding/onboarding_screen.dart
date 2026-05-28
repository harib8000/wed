import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

/// Key used to persist whether the user has completed onboarding.
const kHasSeenOnboardingKey = 'hasSeenOnboarding';

class _OnboardingPage {
  final String title;
  final String description;
  final IconData icon;
  final Color iconBgColor;
  final Color iconColor;

  const _OnboardingPage({
    required this.title,
    required this.description,
    required this.icon,
    required this.iconBgColor,
    required this.iconColor,
  });
}

const _pages = [
  _OnboardingPage(
    title: 'Discover Top Wedding Vendors',
    description:
        'Browse thousands of verified vendors — photographers, decorators, caterers & more — all in one place.',
    icon: Icons.explore,
    iconBgColor: Color(0xFFFDF4FF),
    iconColor: Color(0xFFC026D3),
  ),
  _OnboardingPage(
    title: 'Book & Pay Securely',
    description:
        'Escrow-protected payments ensure your money is safe. Pay only when you\'re satisfied with the service.',
    icon: Icons.lock,
    iconBgColor: Color(0xFFECFDF5),
    iconColor: Color(0xFF059669),
  ),
  _OnboardingPage(
    title: 'Plan Your Dream Wedding',
    description:
        'Checklists, budgets, guest lists & timelines — everything you need to plan the perfect celebration.',
    icon: Icons.checklist,
    iconBgColor: Color(0xFFFEF3C7),
    iconColor: Color(0xFFD97706),
  ),
  _OnboardingPage(
    title: 'Real-Time Chat & Updates',
    description:
        'Message vendors directly, get instant booking updates, and stay on top of every detail.',
    icon: Icons.chat_bubble_outline,
    iconBgColor: Color(0xFFEEF2FF),
    iconColor: Color(0xFF4F46E5),
  ),
];

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen>
    with TickerProviderStateMixin {
  final _pageController = PageController();
  int _currentPage = 0;
  late final List<AnimationController> _iconAnimControllers;
  late final List<Animation<double>> _iconAnimations;

  @override
  void initState() {
    super.initState();
    _iconAnimControllers = List.generate(
      _pages.length,
      (i) => AnimationController(
        vsync: this,
        duration: const Duration(milliseconds: 800),
      ),
    );
    _iconAnimations = _iconAnimControllers
        .map((c) => CurvedAnimation(parent: c, curve: Curves.elasticOut))
        .toList();
    _iconAnimControllers[0].forward();
  }

  @override
  void dispose() {
    _pageController.dispose();
    for (final c in _iconAnimControllers) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _completeOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(kHasSeenOnboardingKey, true);
    if (mounted) context.go('/login');
  }

  void _onPageChanged(int page) {
    setState(() => _currentPage = page);
    _iconAnimControllers[page].forward(from: 0);
  }

  @override
  Widget build(BuildContext context) {
    final isLastPage = _currentPage == _pages.length - 1;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Skip button
            Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: TextButton(
                  onPressed: _completeOnboarding,
                  child: Text(
                    'Skip',
                    style: TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ),

            // Page content
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: _onPageChanged,
                itemCount: _pages.length,
                itemBuilder: (context, index) {
                  final page = _pages[index];
                  return _OnboardingPageView(
                    page: page,
                    animation: _iconAnimations[index],
                  );
                },
              ),
            ),

            // Page indicator
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: SmoothPageIndicator(
                controller: _pageController,
                count: _pages.length,
                effect: ExpandingDotsEffect(
                  dotHeight: 8,
                  dotWidth: 8,
                  activeDotColor: AppColors.brand,
                  dotColor: AppColors.border,
                  expansionFactor: 3,
                ),
              ),
            ),

            // CTA button
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: isLastPage
                      ? _completeOnboarding
                      : () => _pageController.nextPage(
                            duration: const Duration(milliseconds: 400),
                            curve: Curves.easeInOut,
                          ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.brand,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    isLastPage ? 'Get Started' : 'Next',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OnboardingPageView extends StatelessWidget {
  final _OnboardingPage page;
  final Animation<double> animation;

  const _OnboardingPageView({
    required this.page,
    required this.animation,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Illustration area
          ScaleTransition(
            scale: animation,
            child: Container(
              width: 160,
              height: 160,
              decoration: BoxDecoration(
                color: page.iconBgColor,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: page.iconColor.withOpacity(0.15),
                    blurRadius: 40,
                    spreadRadius: 10,
                  ),
                ],
              ),
              child: Center(
                child: Icon(page.icon, size: 72, color: page.iconColor),
              ),
            ),
          ),
          const SizedBox(height: 48),

          // Title
          Text(
            page.title,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  height: 1.3,
                ),
          ),
          const SizedBox(height: 16),

          // Description
          Text(
            page.description,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 15,
              height: 1.6,
            ),
          ),
        ],
      ),
    );
  }
}
