import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/theme.dart';

class CoordinatorOnboardingScreen extends StatefulWidget {
  const CoordinatorOnboardingScreen({super.key});

  @override
  State<CoordinatorOnboardingScreen> createState() => _CoordinatorOnboardingScreenState();
}

class _CoordinatorOnboardingScreenState extends State<CoordinatorOnboardingScreen> {
  final PageController _pageController = PageController();
  final ImagePicker _imagePicker = ImagePicker();

  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _cityController = TextEditingController(text: 'Hyderabad');
  final _experienceController = TextEditingController();
  final _bioController = TextEditingController();
  final _certificationController = TextEditingController();

  int _currentStep = 0;
  bool _submitted = false;
  final Set<String> _specializations = {'Hindu Wedding', 'Luxury Wedding'};
  RangeValues _priceRange = const RangeValues(20000, 100000);
  double _maxSimultaneousEvents = 3;
  XFile? _profilePhoto;
  final List<XFile> _eventPhotos = [];

  @override
  void dispose() {
    _pageController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _cityController.dispose();
    _experienceController.dispose();
    _bioController.dispose();
    _certificationController.dispose();
    super.dispose();
  }

  bool _validateStep() {
    if (_currentStep == 0) {
      if (_nameController.text.trim().isEmpty ||
          _phoneController.text.trim().isEmpty ||
          _cityController.text.trim().isEmpty ||
          _experienceController.text.trim().isEmpty) {
        _showMessage('Please complete personal information.');
        return false;
      }
    } else if (_currentStep == 1) {
      if (_specializations.isEmpty) {
        _showMessage('Select at least one specialization.');
        return false;
      }
    } else if (_currentStep == 2) {
      if (_bioController.text.trim().isEmpty || _bioController.text.trim().length > 500) {
        _showMessage('Add a short bio within 500 characters.');
        return false;
      }
    } else if (_currentStep == 3) {
      if (_profilePhoto == null || _eventPhotos.isEmpty) {
        _showMessage('Upload a profile photo and portfolio images.');
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

  Future<void> _pickProfilePhoto() async {
    final file = await _imagePicker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (file == null) return;
    setState(() => _profilePhoto = file);
  }

  Future<void> _pickEventPhotos() async {
    final files = await _imagePicker.pickMultiImage(imageQuality: 80);
    if (files.isEmpty) return;
    setState(() {
      _eventPhotos
        ..clear()
        ..addAll(files.take(5));
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_submitted) {
      return Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(title: const Text('Coordinator Registration')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    color: AppColors.coordinator.withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.assignment_turned_in_outlined, color: AppColors.coordinator, size: 48),
                ),
                const SizedBox(height: 24),
                Text(
                  'Profile Under Review',
                  style: Theme.of(context).textTheme.headlineMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                const Text(
                  'Your coordinator profile has been submitted. Our team will verify your experience and activate event management access soon.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondary, height: 1.5),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.coordinator),
                    onPressed: () async {
                      await HapticFeedback.lightImpact();
                      if (!context.mounted) return;
                      context.go('/coordinator/dashboard');
                    },
                    child: const Text('Go to Coordinator Dashboard'),
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
      appBar: AppBar(title: const Text('Coordinator Registration')),
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
                      style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.coordinator),
                    ),
                    Text(
                      _coordinatorStepTitles[_currentStep],
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
                    valueColor: const AlwaysStoppedAnimation<Color>(AppColors.coordinator),
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
                _PersonalInfoStep(
                  nameController: _nameController,
                  phoneController: _phoneController,
                  cityController: _cityController,
                  experienceController: _experienceController,
                ),
                _SpecializationsStep(
                  selectedSpecializations: _specializations,
                  onToggle: (item) {
                    setState(() {
                      if (_specializations.contains(item)) {
                        _specializations.remove(item);
                      } else {
                        _specializations.add(item);
                      }
                    });
                  },
                ),
                _CoordinatorServiceDetailsStep(
                  bioController: _bioController,
                  priceRange: _priceRange,
                  maxSimultaneousEvents: _maxSimultaneousEvents,
                  onPriceChanged: (value) => setState(() => _priceRange = value),
                  onMaxEventsChanged: (value) => setState(() => _maxSimultaneousEvents = value),
                ),
                _CoordinatorPortfolioStep(
                  profilePhoto: _profilePhoto,
                  eventPhotos: _eventPhotos,
                  certificationController: _certificationController,
                  onPickProfile: _pickProfilePhoto,
                  onPickPortfolio: _pickEventPhotos,
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
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.coordinator),
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

class _PersonalInfoStep extends StatelessWidget {
  final TextEditingController nameController;
  final TextEditingController phoneController;
  final TextEditingController cityController;
  final TextEditingController experienceController;

  const _PersonalInfoStep({
    required this.nameController,
    required this.phoneController,
    required this.cityController,
    required this.experienceController,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Full name')),
        const SizedBox(height: 12),
        TextField(
          controller: phoneController,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(labelText: 'Phone number'),
        ),
        const SizedBox(height: 12),
        TextField(controller: cityController, decoration: const InputDecoration(labelText: 'City')),
        const SizedBox(height: 12),
        TextField(
          controller: experienceController,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Experience years'),
        ),
      ],
    );
  }
}

class _SpecializationsStep extends StatelessWidget {
  final Set<String> selectedSpecializations;
  final ValueChanged<String> onToggle;

  const _SpecializationsStep({required this.selectedSpecializations, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Select your specializations',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 18),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: _specializationOptions
              .map(
                (item) => FilterChip(
                  label: Text(item),
                  selected: selectedSpecializations.contains(item),
                  onSelected: (_) => onToggle(item),
                  selectedColor: AppColors.coordinatorLight,
                ),
              )
              .toList(),
        ),
      ],
    );
  }
}

class _CoordinatorServiceDetailsStep extends StatelessWidget {
  final TextEditingController bioController;
  final RangeValues priceRange;
  final double maxSimultaneousEvents;
  final ValueChanged<RangeValues> onPriceChanged;
  final ValueChanged<double> onMaxEventsChanged;

  const _CoordinatorServiceDetailsStep({
    required this.bioController,
    required this.priceRange,
    required this.maxSimultaneousEvents,
    required this.onPriceChanged,
    required this.onMaxEventsChanged,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        TextField(
          controller: bioController,
          maxLength: 500,
          maxLines: 5,
          decoration: const InputDecoration(
            labelText: 'Professional bio',
            hintText: 'Share your planning style, strengths, and events you enjoy leading.',
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Price range per event: ₹${priceRange.start.round()} - ₹${priceRange.end.round()}',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 16),
        ),
        RangeSlider(
          min: 20000,
          max: 500000,
          divisions: 24,
          values: priceRange,
          labels: RangeLabels('₹${priceRange.start.round()}', '₹${priceRange.end.round()}'),
          onChanged: onPriceChanged,
        ),
        const SizedBox(height: 8),
        Text(
          'Max simultaneous events: ${maxSimultaneousEvents.round()}',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 16),
        ),
        Slider(
          min: 1,
          max: 10,
          divisions: 9,
          value: maxSimultaneousEvents,
          label: '${maxSimultaneousEvents.round()}',
          onChanged: onMaxEventsChanged,
        ),
      ],
    );
  }
}

class _CoordinatorPortfolioStep extends StatelessWidget {
  final XFile? profilePhoto;
  final List<XFile> eventPhotos;
  final TextEditingController certificationController;
  final VoidCallback onPickProfile;
  final VoidCallback onPickPortfolio;

  const _CoordinatorPortfolioStep({
    required this.profilePhoto,
    required this.eventPhotos,
    required this.certificationController,
    required this.onPickProfile,
    required this.onPickPortfolio,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _CoordinatorUploadTile(
          title: 'Profile photo',
          subtitle: profilePhoto?.name ?? 'Upload your professional headshot',
          onTap: onPickProfile,
        ),
        const SizedBox(height: 12),
        _CoordinatorUploadTile(
          title: 'Past event photos',
          subtitle: eventPhotos.isEmpty ? 'Upload up to 5 event photos' : '${eventPhotos.length} photos selected',
          onTap: onPickPortfolio,
        ),
        const SizedBox(height: 12),
        TextField(
          controller: certificationController,
          decoration: const InputDecoration(
            labelText: 'Professional certifications',
            hintText: 'Wedding planner certification, event management diploma, etc.',
          ),
        ),
      ],
    );
  }
}

class _CoordinatorUploadTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _CoordinatorUploadTile({required this.title, required this.subtitle, required this.onTap});

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
        backgroundColor: AppColors.coordinatorLight,
        child: Icon(Icons.perm_media_outlined, color: AppColors.coordinator),
      ),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.chevron_right_rounded),
    );
  }
}

const _coordinatorStepTitles = <String>[
  'Personal Info',
  'Specializations',
  'Service Details',
  'Portfolio',
];

const _specializationOptions = <String>[
  'Hindu Wedding',
  'Muslim Wedding',
  'Christian Wedding',
  'Destination Wedding',
  'Corporate Event',
  'Budget Wedding',
  'Luxury Wedding',
];
