import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../viewmodels/cgpa_calculator_viewmodel.dart';
import '../widgets/cgpa_widgets.dart';

class CgpaWhatifScreen extends StatefulWidget {
  const CgpaWhatifScreen({super.key});

  @override
  State<CgpaWhatifScreen> createState() => _CgpaWhatifScreenState();
}

class _CgpaWhatifScreenState extends State<CgpaWhatifScreen>
    with SingleTickerProviderStateMixin {
  final TextEditingController _targetController = TextEditingController();
  Map<String, dynamic>? _result;
  late AnimationController _animController;
  late Animation<double> _slideAnim;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _slideAnim = Tween<double>(begin: 30, end: 0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic),
    );
    _fadeAnim = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOutCubic,
    );
  }

  @override
  void dispose() {
    _targetController.dispose();
    _animController.dispose();
    super.dispose();
  }

  void _simulate() {
    final text = _targetController.text.trim();
    if (text.isEmpty) return;
    final target = double.tryParse(text);
    if (target == null || target < 0 || target > 4.0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please enter a valid CGPA between 0.00 and 4.00'),
          backgroundColor: CgpaColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      return;
    }
    final viewModel = context.read<CGPACalculatorViewModel>();
    setState(() {
      _result = viewModel.simulateTargetCgpa(target);
    });
    _animController.forward(from: 0);
  }

  @override
  Widget build(BuildContext context) {
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
          'What-If Calculator',
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
              child: Column(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: CgpaColors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(
                      Icons.psychology_rounded,
                      color: CgpaColors.white,
                      size: 30,
                    ),
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    'Plan Your Future CGPA',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: CgpaColors.white,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Enter your target CGPA to see what you need\nto achieve in your remaining semesters.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: CgpaColors.white.withValues(alpha: 0.85),
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Target input
            const Padding(
              padding: EdgeInsets.only(left: 4, bottom: 10),
              child: Text(
                'Target CGPA',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: CgpaColors.textDark,
                ),
              ),
            ),
            Container(
              decoration: BoxDecoration(
                color: CgpaColors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: CgpaColors.cardShadow,
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: TextField(
                controller: _targetController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: CgpaColors.textDark,
                  fontFamily: 'SpaceGrotesk',
                ),
                decoration: InputDecoration(
                  hintText: 'e.g. 3.80',
                  hintStyle: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    color: CgpaColors.textLight.withValues(alpha: 0.6),
                  ),
                  prefixIcon: Container(
                    margin: const EdgeInsets.all(10),
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: CgpaColors.lightAccent,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.gps_fixed_rounded,
                      color: CgpaColors.primary,
                      size: 20,
                    ),
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  fillColor: CgpaColors.white,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 18,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 22),

            // Simulate button
            PrimaryActionButton(
              label: 'Simulate',
              icon: Icons.play_arrow_rounded,
              onPressed: _simulate,
            ),
            const SizedBox(height: 28),

            // Result
            if (_result != null)
              AnimatedBuilder(
                animation: _animController,
                builder: (context, child) {
                  return Transform.translate(
                    offset: Offset(0, _slideAnim.value),
                    child: Opacity(
                      opacity: _fadeAnim.value,
                      child: child,
                    ),
                  );
                },
                child: Column(
                  children: [
                    // Stats row
                    Row(
                      children: [
                        Expanded(
                          child: StatCard(
                            label: 'Current CGPA',
                            value: (_result!['currentCgpa'] as double).toStringAsFixed(2),
                            icon: Icons.analytics_rounded,
                            accentColor: CgpaColors.secondary,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: StatCard(
                            label: 'Required GPA',
                            value: (_result!['requiredGpa'] as double).toStringAsFixed(2),
                            icon: Icons.flag_rounded,
                            accentColor: (_result!['isAchievable'] as bool)
                                ? CgpaColors.success
                                : CgpaColors.error,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: StatCard(
                            label: 'Completed Cr.',
                            value: (_result!['completedCredits'] as double).toStringAsFixed(0),
                            icon: Icons.check_circle_rounded,
                            accentColor: CgpaColors.primary,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: StatCard(
                            label: 'Remaining Cr.',
                            value: (_result!['remainingCredits'] as double).toStringAsFixed(0),
                            icon: Icons.pending_rounded,
                            accentColor: CgpaColors.warning,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),

                    // Info card
                    InfoCard(
                      title: (_result!['isAchievable'] as bool) ? 'Achievable!' : 'Not Achievable',
                      message: _result!['message'] as String,
                      icon: (_result!['isAchievable'] as bool)
                          ? Icons.check_circle_outline_rounded
                          : Icons.warning_amber_rounded,
                      isSuccess: _result!['isAchievable'] as bool,
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}