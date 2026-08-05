import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../viewmodels/class_reminder_viewmodel.dart';
import '../widgets/cgpa_widgets.dart';

class ClassReminderScreen extends StatelessWidget {
  const ClassReminderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => ClassReminderViewModel(),
      child: const _ClassReminderBody(),
    );
  }
}

class _ClassReminderBody extends StatelessWidget {
  const _ClassReminderBody();

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<ClassReminderViewModel>();

    return Scaffold(
      backgroundColor: CgpaColors.background,
      appBar: AppBar(
        backgroundColor: CgpaColors.background,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: CgpaColors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: CgpaColors.cardShadow,
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: const Icon(
              Icons.arrow_back_ios_new_rounded,
              color: CgpaColors.primary,
              size: 18,
            ),
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Class Reminder',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: CgpaColors.textDark,
          ),
        ),
        centerTitle: true,
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: CgpaColors.lightAccent,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.notifications_active_rounded,
              color: CgpaColors.primary,
              size: 22,
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(22),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [CgpaColors.primary, CgpaColors.secondary],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: CgpaColors.primary.withValues(alpha: 0.3),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: CgpaColors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Icon(
                            Icons.alarm_rounded,
                            color: CgpaColors.white,
                            size: 28,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Reminder Settings',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  color: CgpaColors.white.withValues(alpha: 0.85),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${viewModel.enabledCount} of ${viewModel.reminders.length} Active',
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w700,
                                  color: CgpaColors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Section label
                  const Padding(
                    padding: EdgeInsets.only(left: 4, bottom: 12),
                    child: Text(
                      'Your Courses',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: CgpaColors.textDark,
                      ),
                    ),
                  ),

                  // Reminder cards
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: viewModel.reminders.length,
                    itemBuilder: (context, index) {
                      final reminder = viewModel.reminders[index];
                      return _ReminderCard(
                        courseName: reminder.courseName,
                        isEnabled: reminder.isEnabled,
                        minutesBefore: reminder.minutesBefore,
                        onToggle: () => viewModel.toggleReminder(index),
                        onMinutesChanged: (val) {
                          if (val != null) {
                            viewModel.updateMinutesBefore(index, val);
                          }
                        },
                      );
                    },
                  ),
                ],
              ),
            ),
          ),

          // Bottom save button
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
            decoration: BoxDecoration(
              color: CgpaColors.background,
              boxShadow: [
                BoxShadow(
                  color: CgpaColors.cardShadow,
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (viewModel.isSaved)
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                    decoration: BoxDecoration(
                      color: CgpaColors.success.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: CgpaColors.success.withValues(alpha: 0.3),
                      ),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.check_circle_rounded, color: CgpaColors.success, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Settings saved successfully!',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: CgpaColors.success,
                          ),
                        ),
                      ],
                    ),
                  ),
                PrimaryActionButton(
                  label: 'Save Settings',
                  icon: Icons.save_rounded,
                  onPressed: () => viewModel.saveSettings(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ReminderCard extends StatelessWidget {
  final String courseName;
  final bool isEnabled;
  final int minutesBefore;
  final VoidCallback onToggle;
  final ValueChanged<int?> onMinutesChanged;

  const _ReminderCard({
    required this.courseName,
    required this.isEnabled,
    required this.minutesBefore,
    required this.onToggle,
    required this.onMinutesChanged,
  });

  static const List<int> minuteOptions = [5, 10, 15, 30];

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: CgpaColors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isEnabled
              ? CgpaColors.primary.withValues(alpha: 0.2)
              : CgpaColors.border.withValues(alpha: 0.2),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: isEnabled
                ? CgpaColors.primary.withValues(alpha: 0.06)
                : CgpaColors.cardShadow,
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          // Top row: name + icon + switch
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: isEnabled
                      ? CgpaColors.primary.withValues(alpha: 0.1)
                      : CgpaColors.border.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.notifications_rounded,
                  color: isEnabled ? CgpaColors.primary : CgpaColors.textLight,
                  size: 22,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  courseName,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: isEnabled ? CgpaColors.textDark : CgpaColors.textLight,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Switch.adaptive(
                value: isEnabled,
                onChanged: (_) => onToggle(),
                activeColor: CgpaColors.primary,
                activeTrackColor: CgpaColors.lightAccent,
                inactiveThumbColor: CgpaColors.border,
                inactiveTrackColor: CgpaColors.border.withValues(alpha: 0.2),
              ),
            ],
          ),

          // Minutes dropdown (only if enabled)
          if (isEnabled) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              decoration: BoxDecoration(
                color: CgpaColors.lightAccent.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: CgpaColors.border.withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.timer_outlined,
                    color: CgpaColors.primary,
                    size: 18,
                  ),
                  const SizedBox(width: 10),
                  const Text(
                    'Remind before',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: CgpaColors.textMedium,
                    ),
                  ),
                  const Spacer(),
                  DropdownButtonHideUnderline(
                    child: DropdownButton<int>(
                      value: minutesBefore,
                      isDense: true,
                      borderRadius: BorderRadius.circular(14),
                      dropdownColor: CgpaColors.white,
                      icon: const Icon(
                        Icons.keyboard_arrow_down_rounded,
                        color: CgpaColors.primary,
                        size: 20,
                      ),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: CgpaColors.primary,
                        fontFamily: 'SpaceGrotesk',
                      ),
                      items: minuteOptions.map((min) {
                        return DropdownMenuItem<int>(
                          value: min,
                          child: Text(
                            '$min min',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: CgpaColors.primary,
                              fontFamily: 'SpaceGrotesk',
                            ),
                          ),
                        );
                      }).toList(),
                      onChanged: onMinutesChanged,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}