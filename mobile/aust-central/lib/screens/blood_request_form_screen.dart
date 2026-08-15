import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/blood_request.dart';
import '../services/blood_request_service.dart';
import '../theme/app_colors.dart';
import '../utils/blood_eligibility.dart';

/// Submit a blood request. Returns the created [BloodRequest] via
/// `Navigator.pop` so the launching screen can re-read it from the persistence
/// layer.
class BloodRequestFormScreen extends StatefulWidget {
  /// Pre-selects the user's own blood group when they are a known donor.
  final String? defaultBloodGroup;

  const BloodRequestFormScreen({super.key, this.defaultBloodGroup});

  @override
  State<BloodRequestFormScreen> createState() =>
      _BloodRequestFormScreenState();
}

class _BloodRequestFormScreenState extends State<BloodRequestFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _hospital = TextEditingController();
  final _location = TextEditingController();
  final _units = TextEditingController(text: '1');
  final _contact = TextEditingController();
  final _notes = TextEditingController();

  String? _bloodGroup;
  BloodUrgency _urgency = BloodUrgency.routine;
  DateTime? _requiredBy;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _bloodGroup = widget.defaultBloodGroup;
  }

  @override
  void dispose() {
    _name.dispose();
    _hospital.dispose();
    _location.dispose();
    _units.dispose();
    _contact.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _pickRequiredBy() async {
    final today = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _requiredBy ?? today.add(const Duration(days: 1)),
      firstDate: today,
      lastDate: today.add(const Duration(days: 60)),
      helpText: 'When do you need the blood by?',
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: ColorScheme.light(
            primary: AppColors.darkGreen,
            onPrimary: AppColors.white,
            surface: AppColors.white,
            onSurface: AppColors.textDark,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() => _requiredBy = picked);
    }
  }

  String? _validateBdPhone(String? raw) {
    final v = raw?.trim() ?? '';
    if (v.isEmpty) return 'Required';
    final pattern = RegExp(r'^\+?8801[3-9]\d{8}$|^01[3-9]\d{8}$');
    if (!pattern.hasMatch(v)) {
      return 'Use a valid BD number (e.g. 01712345678)';
    }
    return null;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_requiredBy == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pick a required-by date.')),
      );
      return;
    }
    setState(() => _submitting = true);

    final id = 'mine_${DateTime.now().millisecondsSinceEpoch}';
    final request = BloodRequest(
      id: id,
      patientName: _name.text.trim(),
      bloodGroup: _bloodGroup!,
      hospital: _hospital.text.trim(),
      location: _location.text.trim(),
      units: int.tryParse(_units.text.trim()) ?? 1,
      urgency: _urgency,
      requiredBy: _requiredBy!,
      contactNumber: _contact.text.trim(),
      notes: _notes.text.trim(),
    );

    // TODO: replace with a real network submission.
    await BloodRequestService.addRequest(request);

    if (!mounted) return;
    Navigator.of(context).pop<BloodRequest>(request);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textDark),
        title: const Text(
          'Send Blood Request',
          style: TextStyle(
            color: AppColors.darkGreen,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: Form(
        key: _formKey,
        autovalidateMode: AutovalidateMode.onUserInteraction,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          children: [
            _Section(
              title: 'Patient',
              child: _Field(
                controller: _name,
                label: 'Patient name',
                icon: Icons.person_outline,
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
            ),
            _Section(
              title: 'Required blood',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final g in kBloodGroups)
                        ChoiceChip(
                          label: Text(g),
                          selected: _bloodGroup == g,
                          selectedColor: AppColors.darkGreen,
                          backgroundColor: AppColors.scaffoldBackground,
                          labelStyle: TextStyle(
                            color: _bloodGroup == g
                                ? AppColors.white
                                : AppColors.textDark,
                            fontWeight: FontWeight.w600,
                          ),
                          onSelected: (_) =>
                              setState(() => _bloodGroup = g),
                        ),
                    ],
                  ),
                  if (_bloodGroup == null)
                    Padding(
                      padding: const EdgeInsets.only(top: 6, left: 4),
                      child: Text(
                        'Pick a blood group',
                        style: TextStyle(
                          color: AppColors.danger.withValues(alpha: 0.9),
                          fontSize: 12,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            _Section(
              title: 'Where',
              child: Column(
                children: [
                  _Field(
                    controller: _hospital,
                    label: 'Hospital / Center',
                    icon: Icons.local_hospital_outlined,
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                  const SizedBox(height: 12),
                  _Field(
                    controller: _location,
                    label: 'Location (optional)',
                    icon: Icons.place_outlined,
                  ),
                ],
              ),
            ),
            _Section(
              title: 'Details',
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: _Field(
                          controller: _units,
                          label: 'Units',
                          icon: Icons.bloodtype_outlined,
                          keyboardType: TextInputType.number,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                            LengthLimitingTextInputFormatter(2),
                          ],
                          validator: (v) {
                            final n = int.tryParse((v ?? '').trim());
                            if (n == null || n < 1) {
                              return 'Min 1';
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(14),
                          onTap: _pickRequiredBy,
                          child: InputDecorator(
                            decoration: InputDecoration(
                              filled: true,
                              fillColor: AppColors.white,
                              prefixIcon: Icon(
                                Icons.event_outlined,
                                color: AppColors.subtitleGrey,
                              ),
                              contentPadding: const EdgeInsets.symmetric(
                                  vertical: 14, horizontal: 12),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14),
                                borderSide: BorderSide.none,
                              ),
                            ),
                            child: Text(
                              _requiredBy == null
                                  ? 'Required by'
                                  : formatShortDate(_requiredBy!),
                              style: TextStyle(
                                color: _requiredBy == null
                                    ? AppColors.subtitleGrey
                                    : AppColors.textDark,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Urgency',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.subtitleGrey,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      for (final u in BloodUrgency.values)
                        ChoiceChip(
                          label: Text(u.label),
                          selected: _urgency == u,
                          selectedColor: AppColors.darkGreen,
                          backgroundColor: AppColors.scaffoldBackground,
                          labelStyle: TextStyle(
                            color: _urgency == u
                                ? AppColors.white
                                : AppColors.textDark,
                            fontWeight: FontWeight.w600,
                          ),
                          onSelected: (_) => setState(() => _urgency = u),
                        ),
                    ],
                  ),
                ],
              ),
            ),
            _Section(
              title: 'Contact',
              child: _Field(
                controller: _contact,
                label: 'Contact number',
                icon: Icons.phone_outlined,
                keyboardType: TextInputType.phone,
                validator: _validateBdPhone,
              ),
            ),
            _Section(
              title: 'Notes',
              child: _Field(
                controller: _notes,
                label: 'Anything else (optional)',
                icon: Icons.notes_outlined,
                minLines: 2,
                maxLines: 4,
              ),
            ),
            const SizedBox(height: 8),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.darkGreen,
                foregroundColor: AppColors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                textStyle: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              child: _submitting
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.4,
                        color: AppColors.white,
                      ),
                    )
                  : const Text('Send Request'),
            ),
          ],
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final Widget child;
  const _Section({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 8),
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.textDark,
              ),
            ),
          ),
          child,
        ],
      ),
    );
  }
}

class _Field extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final IconData icon;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? inputFormatters;
  final String? Function(String?)? validator;
  final int? minLines;
  final int? maxLines;

  const _Field({
    required this.controller,
    required this.label,
    required this.icon,
    this.keyboardType,
    this.inputFormatters,
    this.validator,
    this.minLines,
    this.maxLines,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      validator: validator,
      minLines: minLines,
      maxLines: maxLines ?? 1,
      decoration: InputDecoration(
        labelText: label,
        filled: true,
        fillColor: AppColors.white,
        prefixIcon: Icon(icon, color: AppColors.subtitleGrey),
        contentPadding:
            const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }
}
