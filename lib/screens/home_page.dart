import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../theme/app_colors.dart';
import '../widgets/custom_cards.dart';
import '../widgets/transportation_card.dart';

import 'notifications_screen.dart';
import 'todo_list_screen.dart';
import 'class_reminder_screen.dart';
import 'bus_page.dart';
import 'notice_board_screen.dart';
import 'cgpa_calculator_screen.dart';
import 'lab_report_screen.dart';
import 'blood_bank_screen.dart';
import 'book_exchange_screen.dart';
import 'lost_found_screen.dart';
import 'scan_qr_code_screen.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final ScrollController _scrollController = ScrollController();
  double _scrollOffset = 0;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(() {
      setState(() {
        _scrollOffset = _scrollController.offset;
      });
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    if (hour < 20) return 'Evening';
    return 'Night';
  }

  String _formattedDateTime() {
    final now = DateTime.now();
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    final weekday = weekdays[now.weekday - 1];
    final hour12 = now.hour % 12 == 0 ? 12 : now.hour % 12;
    final minute = now.minute.toString().padLeft(2, '0');
    final period = now.hour >= 12 ? 'pm' : 'am';
    return '$weekday, $hour12:$minute $period';
  }

  Widget _iconSwatch(IconData icon) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(color: AppColors.mintChip, borderRadius: BorderRadius.circular(10)),
      child: Icon(icon, color: AppColors.darkGreen, size: 22),
    );
  }

  @override
  Widget build(BuildContext context) {
    const userName = 'Farhana';

    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      body: SafeArea(
        child: SingleChildScrollView(
          controller: _scrollController,
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ---- Top bar ----
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_formattedDateTime(),
                            style: const TextStyle(
                                fontSize: 14, color: AppColors.subtitleGrey, fontWeight: FontWeight.w600, height: 1.0)),
                        const SizedBox(height: 4),
                        Text('${_greeting()}, $userName',
                            style: const TextStyle(
                                fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.textDark, height: 1.1)),
                      ],
                    ),
                  ),
                  InkWell(
                    borderRadius: BorderRadius.circular(30),
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (context) => const NotificationsScreen()));
                    },
                    child: Container(
                      padding: const EdgeInsets.only(left: 12, right: 12, bottom: 12), // no top padding
                      child: SvgPicture.asset(
                        'assets/icons/notification.svg',
                        width: 50,
                        height: 50,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // ---- To-do/Class Reminder column + Transportation ----
              IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Expanded(
                      child: Column(
                        children: [
                          Expanded(
                            child: DashboardCenteredCard(
                              title: 'To-do List',
                              // TODO: '3 due today' is fabricated — page is a static mock, no data model.
                              chipText: '3 due today',
                              onTap: () {
                                Navigator.push(context, MaterialPageRoute(builder: (context) => const TodoListScreen()));
                              },
                            ),
                          ),
                          const SizedBox(height: 12),
                          Expanded(
                            child: DashboardCenteredCard(
                              title: 'Class Reminder',
                              chipText: 'Next Class: 02:30 pm',
                              onTap: () {
                                Navigator.push(context, MaterialPageRoute(builder: (context) => const ClassReminderScreen()));
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TransportationCard(
                        scrollOffset: _scrollOffset,
                        onTap: () {
                          Navigator.push(context, MaterialPageRoute(builder: (context) => const BusPage()));
                        },
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // ---- Notice board ----
              NoticeBoardCard(
                title: 'Notice Board',
                message: 'Mid-term routine released for section B.',
                onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (context) => const NoticeBoardScreen()));
                },
              ),
              const SizedBox(height: 20),

              // ---- Academic section ----
              DashboardSection(
                label: 'Academic',
                children: [
                  IntrinsicHeight(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Expanded(
                          child: DashboardIconCard(
                            title: 'CGPA\nCalculator',
                            chipText: 'Current: 3.72',
                            leadingIcon: _iconSwatch(Icons.calculate),
                            onTap: () {
                              Navigator.push(context, MaterialPageRoute(builder: (context) => const CgpaCalculatorScreen()));
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: DashboardIconCard(
                            title: 'Lab Report\nGenerator',
                            chipText: '1 Draft Saved',
                            leadingIcon: _iconSwatch(Icons.description),
                            onTap: () {
                              Navigator.push(context, MaterialPageRoute(builder: (context) => const LabReportScreen()));
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                ],
              ),
              const SizedBox(height: 20),

              // ---- Community section ----
              DashboardSection(
                label: 'Community',
                children: [
                  IntrinsicHeight(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Expanded(
                          child: DashboardIconCard(
                            title: 'Blood\nBank',
                            chipText: '2 requests nearby',
                            leadingIcon: _iconSwatch(Icons.bloodtype),
                            onTap: () {
                              Navigator.push(context, MaterialPageRoute(builder: (context) => const BloodBankScreen()));
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: DashboardIconCard(
                            title: 'Book\nExchange',
                            chipText: '14 listings',
                            leadingIcon: _iconSwatch(Icons.menu_book),
                            onTap: () {
                              Navigator.push(context, MaterialPageRoute(builder: (context) => const BookExchangeScreen()));
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  IntrinsicHeight(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Expanded(
                          child: DashboardIconCard(
                            title: 'Lost &\nFound',
                            chipText: '5 items',
                            leadingIcon: _iconSwatch(Icons.inventory_2),
                            onTap: () {
                              Navigator.push(context, MaterialPageRoute(builder: (context) => const LostFoundScreen()));
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: DashboardIconCard(
                            title: 'QR\nScanner',
                            chipText: 'Scan',
                            leadingIcon: _iconSwatch(Icons.qr_code_scanner),
                            onTap: () {
                              Navigator.push(context, MaterialPageRoute(builder: (context) => const ScanQrCodeScreen()));
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
