import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:aust_track/theme/app_colors.dart';
import 'package:aust_track/viewmodels/cgpa_calculator_view_model.dart';

class CgpaHistoryScreen extends StatelessWidget {
  const CgpaHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<CGPACalculatorViewModel>();
    final history = viewModel.semesterHistory;

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
          'CGPA History',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: CgpaColors.textDark,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Summary header
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
                      Icons.timeline_rounded,
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
                          'Academic Journey',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: CgpaColors.white.withValues(alpha: 0.85),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${history.length} Semesters Completed',
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
            const SizedBox(height: 28),

            // Timeline
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: history.length,
              itemBuilder: (context, index) {
                final record = history[index];
                final isFirst = index == 0;
                final isLast = index == history.length - 1;

                return _TimelineCard(
                  record: record,
                  index: index,
                  isFirst: isFirst,
                  isLast: isLast,
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _TimelineCard extends StatefulWidget {
  final dynamic record;
  final int index;
  final bool isFirst;
  final bool isLast;

  const _TimelineCard({
    required this.record,
    required this.index,
    required this.isFirst,
    required this.isLast,
  });

  @override
  State<_TimelineCard> createState() => _TimelineCardState();
}

class _TimelineCardState extends State<_TimelineCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _fadeAnim = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    );
    _slideAnim = Tween<Offset>(
      begin: const Offset(0.15, 0),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    ));

    Future.delayed(Duration(milliseconds: 120 * widget.index), () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Color _gpaColor(double gpa) {
    if (gpa >= 3.75) return CgpaColors.success;
    if (gpa >= 3.50) return CgpaColors.primary;
    if (gpa >= 3.00) return CgpaColors.secondary;
    if (gpa >= 2.50) return CgpaColors.warning;
    return CgpaColors.error;
  }

  IconData _gpaIcon(double gpa) {
    if (gpa >= 3.75) return Icons.emoji_events_rounded;
    if (gpa >= 3.50) return Icons.star_rounded;
    if (gpa >= 3.00) return Icons.thumb_up_rounded;
    if (gpa >= 2.50) return Icons.trending_flat_rounded;
    return Icons.trending_down_rounded;
  }

  @override
  Widget build(BuildContext context) {
    final record = widget.record;
    final gpaColor = _gpaColor(record.semesterGpa);

    return FadeTransition(
      opacity: _fadeAnim,
      child: SlideTransition(
        position: _slideAnim,
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Timeline indicator
              SizedBox(
                width: 44,
                child: Column(
                  children: [
                    if (!widget.isFirst)
                      Expanded(
                        child: Container(
                          width: 2.5,
                          color: CgpaColors.lightAccent,
                        ),
                      ),
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: gpaColor.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                        border: Border.all(color: gpaColor, width: 2.5),
                      ),
                      child: Icon(
                        _gpaIcon(record.semesterGpa),
                        color: gpaColor,
                        size: 18,
                      ),
                    ),
                    if (!widget.isLast)
                      Expanded(
                        child: Container(
                          width: 2.5,
                          color: CgpaColors.lightAccent,
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 12),

              // Card content
              Expanded(
                child: Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: CgpaColors.white,
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: CgpaColors.cardShadow,
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Semester name + badge
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              record.semesterName,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: CgpaColors.textDark,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 5,
                            ),
                            decoration: BoxDecoration(
                              color: gpaColor.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              '${record.totalCredits} Cr',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: gpaColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // GPA stats row
                      Row(
                        children: [
                          _GpaStat(
                            label: 'Semester GPA',
                            value: record.semesterGpa.toStringAsFixed(2),
                            color: gpaColor,
                          ),
                          const SizedBox(width: 20),
                          Container(
                            width: 1.5,
                            height: 36,
                            color: CgpaColors.border.withValues(alpha: 0.3),
                          ),
                          const SizedBox(width: 20),
                          _GpaStat(
                            label: 'Cumulative CGPA',
                            value: record.cumulativeCgpa.toStringAsFixed(2),
                            color: CgpaColors.primary,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GpaStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _GpaStat({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: color,
            height: 1.1,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: CgpaColors.textLight,
          ),
        ),
      ],
    );
  }
}