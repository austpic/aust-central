import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/blood_request.dart';
import '../theme/app_colors.dart';
import '../utils/blood_eligibility.dart';

/// Renders a single incoming (or "my outgoing") blood request.
///
/// The same widget backs both the active-requests feed on the bank screen
/// and the "my submitted" list below the form — minimises vocabulary drift
/// between the two views (impeccable product rule).
class BloodRequestCard extends StatelessWidget {
  final BloodRequest request;
  final bool mine;
  final VoidCallback? onHelp;
  final VoidCallback? onCancel;

  const BloodRequestCard({
    super.key,
    required this.request,
    this.mine = false,
    this.onHelp,
    this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final urgency = urgencyStyle(request.urgency);
    final border = urgencyBorder(request.urgency);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.mintChip),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Avatar(initials: request.initials, urgency: request.urgency),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            request.patientName,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textDark,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        _BloodGroupPill(group: request.bloodGroup),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${request.hospital} · ${request.location}',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.subtitleGrey,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              _MetaChip(
                icon: Icons.bloodtype_outlined,
                label: '${request.units} unit${request.units == 1 ? '' : 's'}',
              ),
              _MetaChip(
                icon: Icons.event_outlined,
                label: 'By ${formatShortDate(request.requiredBy)}',
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: urgency.background,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: border.withValues(alpha: 0.4)),
                ),
                child: Text(
                  request.urgency.label.toUpperCase(),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: urgency.foreground,
                    letterSpacing: 0.4,
                  ),
                ),
              ),
            ],
          ),
          if (request.notes.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.scaffoldBackground,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                request.notes,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textDark,
                  height: 1.35,
                ),
              ),
            ),
          ],
          const SizedBox(height: 12),
          if (mine)
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Clipboard.setData(
                          ClipboardData(text: request.contactNumber));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                            content: Text('Contact number copied')),
                      );
                    },
                    icon: const Icon(Icons.copy_outlined, size: 18),
                    label: const Text('Copy contact'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.textDark,
                      side: BorderSide(color: AppColors.mintChip),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onCancel,
                    icon: const Icon(Icons.delete_outline, size: 18),
                    label: const Text('Cancel'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.danger,
                      side: BorderSide(
                          color: AppColors.danger.withValues(alpha: 0.4)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            )
          else
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Clipboard.setData(
                          ClipboardData(text: request.contactNumber));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                            content: Text('Contact number copied')),
                      );
                    },
                    icon: const Icon(Icons.phone_outlined, size: 18),
                    label: const Text('Contact'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.textDark,
                      side: BorderSide(color: AppColors.mintChip),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: onHelp,
                    icon: const Icon(Icons.volunteer_activism, size: 18),
                    label: const Text('I can help'),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.darkGreen,
                      foregroundColor: AppColors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  final String initials;
  final BloodUrgency urgency;
  const _Avatar({required this.initials, required this.urgency});

  @override
  Widget build(BuildContext context) {
    final base = urgencyBorder(urgency);
    return Container(
      width: 46,
      height: 46,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: AppColors.bloodRedSoft.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: base.withValues(alpha: 0.4)),
      ),
      child: Text(
        initials,
        style: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: base,
        ),
      ),
    );
  }
}

class _BloodGroupPill extends StatelessWidget {
  final String group;
  const _BloodGroupPill({required this.group});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.darkGreen,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        group,
        style: const TextStyle(
          color: AppColors.white,
          fontSize: 12.5,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _MetaChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.scaffoldBackground,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.subtitleGrey),
          const SizedBox(width: 5),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12.5,
              color: AppColors.textDark,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
