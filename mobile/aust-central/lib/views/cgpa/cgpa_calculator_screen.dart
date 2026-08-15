import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:aust_track/theme/app_colors.dart';
import 'package:aust_track/data/repositories/academic_repository.dart';
import 'package:aust_track/viewmodels/cgpa_calculator_view_model.dart';
import 'package:aust_track/views/widgets/async_views.dart';
import 'package:aust_track/views/widgets/cgpa_widgets.dart';
import 'package:aust_track/views/cgpa/cgpa_whatif_screen.dart';
import 'package:aust_track/views/cgpa/cgpa_history_screen.dart';

class CgpaCalculatorScreen extends StatelessWidget {
  const CgpaCalculatorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => CGPACalculatorViewModel(
        context.read<AcademicRepository>(),
      ),
      child: const _CgpaCalculatorBody(),
    );
  }
}

class _CgpaCalculatorBody extends StatefulWidget {
  const _CgpaCalculatorBody();

  @override
  State<_CgpaCalculatorBody> createState() => _CgpaCalculatorBodyState();
}

class _CgpaCalculatorBodyState extends State<_CgpaCalculatorBody>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnim = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOutCubic,
    );
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<CGPACalculatorViewModel>();

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
          'CGPA Calculator',
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
              Icons.calculate_rounded,
              color: CgpaColors.primary,
              size: 22,
            ),
          ),
        ],
      ),
      body: viewModel.isLoading
          ? const LoadingView()
          : viewModel.error != null
          ? ErrorView(message: viewModel.error!, onRetry: viewModel.load)
          : SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
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
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: CgpaColors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(Icons.school_rounded, color: CgpaColors.white, size: 26),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Current Semester',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: CgpaColors.lightAccent,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${viewModel.courses.length} Courses • ${viewModel.totalCurrentCredits.toStringAsFixed(1)} Credits',
                          style: const TextStyle(
                            fontSize: 18,
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
                'Select Grades',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: CgpaColors.textDark,
                ),
              ),
            ),

            // Course cards
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: viewModel.courses.length,
              itemBuilder: (context, index) {
                final course = viewModel.courses[index];
                return CourseCard(
                  index: index,
                  courseName: course.courseName,
                  credits: course.credits,
                  grade: course.grade,
                  onGradeChanged: (newGrade) {
                    if (newGrade != null) {
                      viewModel.updateGrade(index, newGrade);
                    }
                  },
                );
              },
            ),
            const SizedBox(height: 20),

            // Calculate button
            PrimaryActionButton(
              label: 'Calculate GPA',
              icon: Icons.auto_graph_rounded,
              onPressed: () {
                viewModel.calculate();
                _animController.forward(from: 0);
              },
            ),
            const SizedBox(height: 24),

            // Results
            if (viewModel.isCalculated)
              FadeTransition(
                opacity: _fadeAnim,
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: StatCard(
                            label: 'Semester GPA',
                            value: viewModel.semesterGpa.toStringAsFixed(2),
                            icon: Icons.trending_up_rounded,
                            accentColor: CgpaColors.primary,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: StatCard(
                            label: 'Cumulative CGPA',
                            value: viewModel.cumulativeCgpa.toStringAsFixed(2),
                            icon: Icons.insights_rounded,
                            accentColor: CgpaColors.secondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: StatCard(
                            label: 'Total Credits',
                            value: viewModel.totalCurrentCredits.toStringAsFixed(1),
                            icon: Icons.menu_book_rounded,
                            accentColor: CgpaColors.warning,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: StatCard(
                            label: 'Courses',
                            value: '${viewModel.courses.length}',
                            icon: Icons.class_rounded,
                            accentColor: CgpaColors.success,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),

            // Bottom buttons
            Row(
              children: [
                Expanded(
                  child: SecondaryActionButton(
                    label: 'What-If Calculator',
                    icon: Icons.psychology_rounded,
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ChangeNotifierProvider.value(
                            value: viewModel,
                            child: const CgpaWhatifScreen(),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: SecondaryActionButton(
                    label: 'History',
                    icon: Icons.history_rounded,
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ChangeNotifierProvider.value(
                            value: viewModel,
                            child: const CgpaHistoryScreen(),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}