import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';

enum _KycStep { docType, upload, review }

const _docTypes = [
  _DocOption(value: 'AADHAAR', label: 'Aadhaar Card', icon: Icons.credit_card),
  _DocOption(value: 'PAN', label: 'PAN Card', icon: Icons.credit_card_outlined),
  _DocOption(value: 'GSTIN', label: 'GST Certificate', icon: Icons.receipt_long),
  _DocOption(value: 'BANK_STATEMENT', label: 'Bank Statement', icon: Icons.account_balance),
];

class _DocOption {
  final String value;
  final String label;
  final IconData icon;
  const _DocOption({required this.value, required this.label, required this.icon});
}

class VendorKycScreen extends ConsumerStatefulWidget {
  const VendorKycScreen({super.key});

  @override
  ConsumerState<VendorKycScreen> createState() => _VendorKycScreenState();
}

class _VendorKycScreenState extends ConsumerState<VendorKycScreen> {
  _KycStep _step = _KycStep.docType;
  String _selectedDocType = '';
  File? _selectedFile;
  bool _isUploading = false;
  String _errorMsg = '';

  final _picker = ImagePicker();

  Future<void> _pickDocument() async {
    final source = await _showSourceDialog();
    if (source == null) return;

    final picked = await _picker.pickImage(source: source, imageQuality: 85, maxWidth: 1920);
    if (picked == null) return;

    setState(() {
      _selectedFile = File(picked.path);
      _step = _KycStep.review;
    });
  }

  Future<ImageSource?> _showSourceDialog() {
    return showModalBottomSheet<ImageSource>(
      context: context,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Take a photo'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Choose from gallery'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submitKyc() async {
    if (_selectedFile == null) return;
    setState(() { _isUploading = true; _errorMsg = ''; });

    try {
      // Step 1: Get presigned URL from user-service
      final presignRes = await ApiClient.dio.post(
        '/users/me/kyc/presign',
        data: {'docType': _selectedDocType, 'contentType': 'image/jpeg'},
      );
      final uploadUrl = presignRes.data['data']['uploadUrl'] as String;

      // Step 2: Upload directly to S3
      final bytes = await _selectedFile!.readAsBytes();
      await ApiClient.uploadToS3(uploadUrl, bytes, 'image/jpeg');

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Document submitted for verification. We\'ll review within 24–48 hours.'),
            backgroundColor: AppColors.success,
            duration: Duration(seconds: 4),
          ),
        );
        context.pop();
      }
    } catch (e) {
      setState(() => _errorMsg = 'Upload failed. Please check your connection and try again.');
    } finally {
      setState(() => _isUploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('KYC Verification'),
        leading: IconButton(
          tooltip: 'Back',
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (_step == _KycStep.docType) {
              context.pop();
            } else {
              setState(() {
                _step = _step == _KycStep.review ? _KycStep.upload : _KycStep.docType;
                if (_step == _KycStep.docType) {
                  _selectedFile = null;
                  _selectedDocType = '';
                }
              });
            }
          },
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // ─── Progress Stepper ──────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
              child: Row(
                children: [
                  _StepDot(active: _step.index >= 0, label: '1'),
                  Expanded(child: Divider(color: _step.index >= 1 ? AppColors.brand : AppColors.border, thickness: 2)),
                  _StepDot(active: _step.index >= 1, label: '2'),
                  Expanded(child: Divider(color: _step.index >= 2 ? AppColors.brand : AppColors.border, thickness: 2)),
                  _StepDot(active: _step.index >= 2, label: '3'),
                ],
              ),
            ),

            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: switch (_step) {
                  _KycStep.docType => _DocTypeStep(
                      key: const ValueKey('docType'),
                      onSelect: (type) => setState(() {
                        _selectedDocType = type;
                        _step = _KycStep.upload;
                      }),
                    ),
                  _KycStep.upload => _UploadStep(
                      key: const ValueKey('upload'),
                      docType: _selectedDocType,
                      onPickDocument: _pickDocument,
                    ),
                  _KycStep.review => _ReviewStep(
                      key: const ValueKey('review'),
                      file: _selectedFile!,
                      docType: _selectedDocType,
                      isUploading: _isUploading,
                      errorMsg: _errorMsg,
                      onSubmit: _submitKyc,
                      onRetake: () => setState(() {
                        _selectedFile = null;
                        _step = _KycStep.upload;
                      }),
                    ),
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StepDot extends StatelessWidget {
  final bool active;
  final String label;
  const _StepDot({required this.active, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        color: active ? AppColors.brand : AppColors.border,
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          label,
          style: TextStyle(
            color: active ? Colors.white : AppColors.textMuted,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}

// ─── Step 1: Select document type ────────────────────────────
class _DocTypeStep extends StatelessWidget {
  final void Function(String) onSelect;
  const _DocTypeStep({super.key, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Choose a document', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text(
            'Submit one government-issued ID to verify your vendor account.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 24),
          ..._docTypes.map(
            (doc) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Semantics(
                button: true,
                label: 'Select ${doc.label}',
                child: InkWell(
                  onTap: () => onSelect(doc.value),
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: AppColors.brandLight,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(doc.icon, color: AppColors.brand),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Text(doc.label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                        ),
                        const Icon(Icons.chevron_right, color: AppColors.textMuted),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Step 2: Upload photo ─────────────────────────────────────
class _UploadStep extends StatelessWidget {
  final String docType;
  final VoidCallback onPickDocument;
  const _UploadStep({super.key, required this.docType, required this.onPickDocument});

  @override
  Widget build(BuildContext context) {
    final docLabel = _docTypes.firstWhere((d) => d.value == docType, orElse: () => _docTypes.first).label;
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text('Upload $docLabel', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text(
            'Take a clear photo of the document. Make sure all four corners are visible.',
            style: Theme.of(context).textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 40),
          Semantics(
            button: true,
            label: 'Take or choose photo',
            child: GestureDetector(
              onTap: onPickDocument,
              child: Container(
                width: double.infinity,
                height: 200,
                decoration: BoxDecoration(
                  color: AppColors.brandLight,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.brand.withOpacity(0.4), width: 2, style: BorderStyle.solid),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.add_a_photo, size: 48, color: AppColors.brand),
                    const SizedBox(height: 12),
                    Text('Tap to capture or choose photo', style: TextStyle(color: AppColors.brand, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          _Tip(text: 'Ensure good lighting — avoid glare or shadows'),
          _Tip(text: 'Document must be valid and not expired'),
          _Tip(text: 'Accepted formats: JPG, PNG'),
        ],
      ),
    );
  }
}

// ─── Step 3: Review & submit ──────────────────────────────────
class _ReviewStep extends StatelessWidget {
  final File file;
  final String docType;
  final bool isUploading;
  final String errorMsg;
  final VoidCallback onSubmit;
  final VoidCallback onRetake;

  const _ReviewStep({
    super.key,
    required this.file,
    required this.docType,
    required this.isUploading,
    required this.errorMsg,
    required this.onSubmit,
    required this.onRetake,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Text('Review & Submit', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text('Confirm the document looks clear before submitting.', style: Theme.of(context).textTheme.bodyMedium, textAlign: TextAlign.center),
          const SizedBox(height: 24),
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Image.file(file, width: double.infinity, height: 220, fit: BoxFit.cover),
          ),
          if (errorMsg.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(errorMsg, style: const TextStyle(color: AppColors.error, fontSize: 13), textAlign: TextAlign.center),
          ],
          const Spacer(),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: isUploading ? null : onRetake,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retake'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: isUploading ? null : onSubmit,
                  child: isUploading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Submit'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

class _Tip extends StatelessWidget {
  final String text;
  const _Tip({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          const Icon(Icons.check_circle_outline, size: 16, color: AppColors.success),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary))),
        ],
      ),
    );
  }
}
