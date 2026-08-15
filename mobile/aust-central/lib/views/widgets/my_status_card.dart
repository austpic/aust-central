import 'package:flutter/material.dart';
import 'package:aust_track/data/models/donor_profile.dart';
import 'package:aust_track/theme/app_colors.dart';
import 'package:aust_track/utils/blood_helpers.dart';

/// "My Status" surface — the only place a user can flip their donor
/// availability, set their blood group, or record a donation date. Lives at
/// the top of the Blood Bank screen so donors never have to dig for it.
class MyStatusCard extends StatefulWidget {
  final DonorProfile profile;
  final ValueChanged<DonorProfile> onChanged;

  const MyStatusCard({
    super.key,
    required this.profile,
    required this.onChanged,
  });

  @override
  State<MyStatusCard> createState() => _MyStatusCardState();
}

class _MyStatusCardState extends State<MyStatusCard> {
  late bool _available = widget.profile.available;
  late String? _bloodGroup = widget.profile.bloodGroup;
  late DateTime? _lastDonated = widget.profile.lastDonated;

  // Local optimistic copy — only flush to caller after the user has finished
  // interacting, so we don't write to SharedPreferences mid-form.
  void _emit() {
    widget.onChanged(
      DonorProfile(
        available: _available,
        bloodGroup: _bloodGroup,
        lastDonated: _lastDonated,
      ),
    );
  }

  Future<void> _pickDate() async {
    final today = DateTime.now();
    final firstAllowed = today.subtract(
      const Duration(days: 365 * 2),
    );
    final initial = BloodEligibility.clampToPastOrToday(
      _lastDonated ?? today,
      today,
    );
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: firstAllowed,
      lastDate: today,
      helpText: 'When did you last donate?',
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
      setState(() {
        _lastDonated = BloodEligibility.clampToPastOrToday(picked, today);
      });
      _emit();
    }
  }

  @override
  Widget build(BuildContext context) {
    // Straight from the server — see DonorProfile. The card used to derive
    // eligibility here, which meant the 90-day rule lived in two places.
    final eligible = widget.profile.eligible;
    final progress = widget.profile.progress;
    final progressColor =
        eligible ? AppColors.success : AppColors.darkGreen;

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row: title + availability switch.
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'My Donor Status',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textDark,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _available
                          ? 'You can be reached for donations'
                          : 'You are not listed as a donor',
                      style: TextStyle(
                        fontSize: 12.5,
                        color: AppColors.subtitleGrey,
                      ),
                    ),
                  ],
                ),
              ),
              Switch.adaptive(
                value: _available,
                activeThumbColor: AppColors.darkGreen,
                onChanged: (v) {
                  setState(() => _available = v);
                  _emit();
                },
              ),
            ],
          ),

          // Blood group + last-donated only meaningful when available is on,
          // but we keep them visible (dimmed) so users can pre-fill even when
          // temporarily off — matches the dashboard's "edit your info" mental
          // model.
          const SizedBox(height: 14),
          Opacity(
            opacity: _available ? 1 : 0.5,
            child: IgnorePointer(
              ignoring: !_available,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      _BloodGroupPill(
                        bloodGroup: _bloodGroup,
                        onTap: _pickBloodGroup,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _available ? _pickDate : null,
                          icon: const Icon(Icons.calendar_month_outlined,
                              size: 18),
                          label: Text(
                            _lastDonated == null
                                ? 'Set last donated'
                                : 'Last donated: ${formatShortDate(_lastDonated!)}',
                            style: const TextStyle(fontSize: 13),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.textDark,
                            side: BorderSide(color: AppColors.mintChip),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            backgroundColor: AppColors.scaffoldBackground,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          widget.profile.statusCopy,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: progressColor,
                          ),
                        ),
                      ),
                      Text(
                        BloodEligibility.sinceCopy(_lastDonated),
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.subtitleGrey,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: _lastDonated == null ? 0 : progress,
                      minHeight: 8,
                      backgroundColor: AppColors.mintChip,
                      valueColor: AlwaysStoppedAnimation(progressColor),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _pickBloodGroup() async {
    final picked = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Wrap(
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
                    onSelected: (_) => Navigator.of(ctx).pop(g),
                  ),
              ],
            ),
          ),
        );
      },
    );
    if (picked != null) {
      setState(() => _bloodGroup = picked);
      _emit();
    }
  }
}

class _BloodGroupPill extends StatelessWidget {
  final String? bloodGroup;
  final VoidCallback onTap;

  const _BloodGroupPill({required this.bloodGroup, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minWidth: 84),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.mintChip,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              bloodGroup ?? 'Set group',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: bloodGroup == null
                    ? AppColors.subtitleGrey
                    : AppColors.textDark,
              ),
            ),
            const SizedBox(width: 6),
            Icon(Icons.expand_more, size: 18, color: AppColors.textDark),
          ],
        ),
      ),
    );
  }
}
