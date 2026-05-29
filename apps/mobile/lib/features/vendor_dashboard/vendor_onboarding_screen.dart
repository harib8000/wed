import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/theme.dart';

class VendorOnboardingScreen extends StatefulWidget {
  const VendorOnboardingScreen({super.key});

  @override
  State<VendorOnboardingScreen> createState() => _VendorOnboardingScreenState();
}

class _VendorOnboardingScreenState extends State<VendorOnboardingScreen> {
  final PageController _pageController = PageController();
  final ImagePicker _imagePicker = ImagePicker();

  final _businessNameController = TextEditingController();
  final _cityController = TextEditingController(text: 'Hyderabad');
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _experienceController = TextEditingController();
  final _packageNameController = TextEditingController();
  final _packagePriceController = TextEditingController();
  final _inclusionController = TextEditingController();
  final _gstController = TextEditingController();

  int _currentStep = 0;
  bool _submitted = false;
  String? _category;
  RangeValues _priceRange = const RangeValues(5000, 150000);
  final Set<String> _serviceAreas = {'Hyderabad', 'Secunderabad'};
  final List<String> _packageInclusions = ['Photography team', 'Edited album'];
  XFile? _profilePhoto;
  final List<XFile> _portfolioImages = [];

  @override
  void dispose() {
    _pageController.dispose();
    _businessNameController.dispose();
    _cityController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _descriptionController.dispose();
    _experienceController.dispose();
    _packageNameController.dispose();
    _packagePriceController.dispose();
    _inclusionController.dispose();
    _gstController.dispose();
    super.dispose();
  }

  Future<void> _nextStep() async {
    await HapticFeedback.lightImpact();
    if (!_validateStep()) return;
    if (_currentStep == 3) {
      setState(() => _submitted = true);
      return;
    }
    setState(() => _currentStep += 1);
    await _pageController.animateToPage(
      _currentStep,
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOut,
    );
  }

  Future<void> _previousStep() async {
    if (_currentStep == 0) return;
    await HapticFeedback.lightImpact();
    setState(() => _currentStep -= 1);
    await _pageController.animateToPage(
      _currentStep,
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOut,
    );
  }

  bool _validateStep() {
    if (_currentStep == 0) {
      if (_businessNameController.text.trim().isEmpty ||
          _category == null ||
          _cityController.text.trim().isEmpty ||
          _phoneController.text.trim().isEmpty ||
          _emailController.text.trim().isEmpty) {
        _showMessage('Please complete business information.');
        return false;
      }
    } else if (_currentStep == 1) {
      if (_descriptionController.text.trim().isEmpty ||
          _experienceController.text.trim().isEmpty ||
          _serviceAreas.isEmpty) {
        _showMessage('Please add service details and experience.');
        return false;
      }
    } else if (_currentStep == 2) {
      if (_packageNameController.text.trim().isEmpty ||
          _packagePriceController.text.trim().isEmpty ||
          _packageInclusions.isEmpty) {
        _showMessage('Please add your first package and inclusions.');
        return false;
      }
    } else if (_currentStep == 3) {
      if (_profilePhoto == null || _portfolioImages.length < 3) {
        _showMessage('Please upload a profile photo and 3 portfolio images.');
        return false;
      }
    }
    return true;
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _pickProfilePhoto() async {
    final file = await _imagePicker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (file == null) return;
    setState(() => _profilePhoto = file);
  }

  Future<void> _pickPortfolioImages() async {
    final files = await _imagePicker.pickMultiImage(imageQuality: 80);
    if (files.isEmpty) return;
    setState(() {
      _portfolioImages
        ..clear()
        ..addAll(files.take(3));
    });
  }

  void _addInclusion() {
    final value = _inclusionController.text.trim();
    if (value.isEmpty) return;
    setState(() {
      _packageInclusions.add(value);
      _inclusionController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_submitted) {
      return Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(title: const Text('Vendor Registration')),
        body: Padding(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    color: AppColors.success.withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.verified_user_outlined, color: AppColors.success, size: 48),
                ),
                const SizedBox(height: 24),
                Text(
                  'Profile Under Review',
                  style: Theme.of(context).textTheme.headlineMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                const Text(
                  'Thanks for joining WeddingOS. Our Hyderabad vendor success team will verify your profile and activate your dashboard soon.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondary, height: 1.5),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      await HapticFeedback.lightImpact();
                      if (!context.mounted) return;
                      context.go('/vendor/dashboard');
                    },
                    child: const Text('Go to Vendor Dashboard'),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('Vendor Registration')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Step ${_currentStep + 1}/4',
                      style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.brand),
                    ),
                    Text(
                      _stepTitles[_currentStep],
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: (_currentStep + 1) / 4,
                    minHeight: 8,
                    backgroundColor: AppColors.border,
                    valueColor: const AlwaysStoppedAnimation<Color>(AppColors.brand),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _BusinessInfoStep(
                  businessNameController: _businessNameController,
                  cityController: _cityController,
                  phoneController: _phoneController,
                  emailController: _emailController,
                  category: _category,
                  onCategoryChanged: (value) => setState(() => _category = value),
                ),
                _ServiceDetailsStep(
                  descriptionController: _descriptionController,
                  experienceController: _experienceController,
                  priceRange: _priceRange,
                  selectedAreas: _serviceAreas,
                  onPriceChanged: (value) => setState(() => _priceRange = value),
                  onAreaToggle: (area) {
                    setState(() {
                      if (_serviceAreas.contains(area)) {
                        _serviceAreas.remove(area);
                      } else {
                        _serviceAreas.add(area);
                      }
                    });
                  },
                ),
                _PackageStep(
                  packageNameController: _packageNameController,
                  packagePriceController: _packagePriceController,
                  inclusionController: _inclusionController,
                  inclusions: _packageInclusions,
                  onAddInclusion: _addInclusion,
                  onRemoveInclusion: (item) => setState(() => _packageInclusions.remove(item)),
                ),
                _DocumentsStep(
                  profilePhoto: _profilePhoto,
                  portfolioImages: _portfolioImages,
                  gstController: _gstController,
                  onPickProfile: _pickProfilePhoto,
                  onPickPortfolio: _pickPortfolioImages,
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _currentStep == 0 ? null : _previousStep,
                    child: const Text('Back'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _nextStep,
                    child: Text(_currentStep == 3 ? 'Submit' : 'Next'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BusinessInfoStep extends StatelessWidget {
  final TextEditingController businessNameController;
  final TextEditingController cityController;
  final TextEditingController phoneController;
  final TextEditingController emailController;
  final String? category;
  final ValueChanged<String?> onCategoryChanged;

  const _BusinessInfoStep({
    required this.businessNameController,
    required this.cityController,
    required this.phoneController,
    required this.emailController,
    required this.category,
    required this.onCategoryChanged,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        TextField(
          controller: businessNameController,
          decoration: const InputDecoration(labelText: 'Business name'),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          value: category,
          items: _vendorCategories
              .map((item) => DropdownMenuItem<String>(value: item, child: Text(item)))
              .toList(),
          onChanged: onCategoryChanged,
          decoration: const InputDecoration(labelText: 'Category'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: cityController,
          decoration: const InputDecoration(labelText: 'City'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: phoneController,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(labelText: 'Phone'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: emailController,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(labelText: 'Email'),
        ),
      ],
    );
  }
}

class _ServiceDetailsStep extends StatelessWidget {
  final TextEditingController descriptionController;
  final TextEditingController experienceController;
  final RangeValues priceRange;
  final Set<String> selectedAreas;
  final ValueChanged<RangeValues> onPriceChanged;
  final ValueChanged<String> onAreaToggle;

  const _ServiceDetailsStep({
    required this.descriptionController,
    required this.experienceController,
    required this.priceRange,
    required this.selectedAreas,
    required this.onPriceChanged,
    required this.onAreaToggle,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        TextField(
          controller: descriptionController,
          maxLines: 5,
          decoration: const InputDecoration(
            labelText: 'Describe your services',
            hintText: 'Tell couples about your style, speciality, and signature offerings.',
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Price range: ₹${priceRange.start.round()} - ₹${priceRange.end.round()}',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 16),
        ),
        RangeSlider(
          min: 5000,
          max: 5000000,
          divisions: 50,
          values: priceRange,
          labels: RangeLabels('₹${priceRange.start.round()}', '₹${priceRange.end.round()}'),
          onChanged: onPriceChanged,
        ),
        const SizedBox(height: 8),
        Text('Service areas', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 16)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _serviceAreaOptions
              .map(
                (area) => FilterChip(
                  label: Text(area),
                  selected: selectedAreas.contains(area),
                  onSelected: (_) => onAreaToggle(area),
                  selectedColor: AppColors.brandLight,
                ),
              )
              .toList(),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: experienceController,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Years of experience'),
        ),
      ],
    );
  }
}

class _PackageStep extends StatelessWidget {
  final TextEditingController packageNameController;
  final TextEditingController packagePriceController;
  final TextEditingController inclusionController;
  final List<String> inclusions;
  final VoidCallback onAddInclusion;
  final ValueChanged<String> onRemoveInclusion;

  const _PackageStep({
    required this.packageNameController,
    required this.packagePriceController,
    required this.inclusionController,
    required this.inclusions,
    required this.onAddInclusion,
    required this.onRemoveInclusion,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        TextField(
          controller: packageNameController,
          decoration: const InputDecoration(labelText: 'Package name'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: packagePriceController,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Package price', prefixText: '₹ '),
        ),
        const SizedBox(height: 16),
        Text('Inclusions', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 16)),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: inclusionController,
                decoration: const InputDecoration(hintText: 'Add inclusion'),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(
              onPressed: onAddInclusion,
              icon: const Icon(Icons.add),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...inclusions.map(
          (item) => Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              title: Text(item),
              trailing: IconButton(
                onPressed: () => onRemoveInclusion(item),
                icon: const Icon(Icons.close),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _DocumentsStep extends StatelessWidget {
  final XFile? profilePhoto;
  final List<XFile> portfolioImages;
  final TextEditingController gstController;
  final VoidCallback onPickProfile;
  final VoidCallback onPickPortfolio;

  const _DocumentsStep({
    required this.profilePhoto,
    required this.portfolioImages,
    required this.gstController,
    required this.onPickProfile,
    required this.onPickPortfolio,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _UploadTile(
          title: 'Profile photo',
          subtitle: profilePhoto?.name ?? 'Upload your business logo or cover image',
          onTap: onPickProfile,
        ),
        const SizedBox(height: 12),
        _UploadTile(
          title: 'Portfolio images',
          subtitle: portfolioImages.isEmpty
              ? 'Add 3 photos from recent weddings'
              : '${portfolioImages.length} images selected',
          onTap: onPickPortfolio,
        ),
        const SizedBox(height: 12),
        TextField(
          controller: gstController,
          decoration: const InputDecoration(
            labelText: 'GST number (optional)',
            hintText: '36ABCDE1234F1Z5',
          ),
        ),
      ],
    );
  }
}

class _UploadTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _UploadTile({required this.title, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      tileColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: AppColors.border),
      ),
      leading: const CircleAvatar(
        backgroundColor: AppColors.brandLight,
        child: Icon(Icons.upload_file_outlined, color: AppColors.brand),
      ),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.chevron_right_rounded),
    );
  }
}

const _stepTitles = <String>[
  'Business Info',
  'Service Details',
  'Add First Package',
  'Upload Documents',
];

const _vendorCategories = <String>[
  'Venue',
  'Photography',
  'Catering',
  'Decor',
  'Makeup',
  'Music',
  'Videography',
  'Mehendi',
];

const _serviceAreaOptions = <String>[
  'Hyderabad',
  'Secunderabad',
  'Gachibowli',
  'Madhapur',
  'Kompally',
  'Shamshabad',
];
