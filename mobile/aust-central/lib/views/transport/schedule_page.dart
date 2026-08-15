import 'package:flutter/material.dart';
import 'package:aust_track/theme/app_colors.dart';
import 'package:aust_track/views/transport/bus_selection_page.dart';

class SchedulePage extends StatefulWidget {
  final String fromLocation;
  final String toLocation;

  const SchedulePage({
    super.key,
    required this.fromLocation,
    required this.toLocation,
  });

  @override
  State<SchedulePage> createState() => _SchedulePageState();
}

class _SchedulePageState extends State<SchedulePage> {
  final List<String> schedules = [
    "06 : 00 am",
    "08 : 30 am",
    "01 : 30 pm",
    "03 : 30 pm",
    "06 : 30 pm",
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textDark),
        title: const Text(
          "Transport",
          style: TextStyle(
            color: AppColors.darkGreen,
            fontSize: 22,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            _LocationCard(
              from: widget.fromLocation,
              to: widget.toLocation,
            ),
            const SizedBox(height: 24),
            const Text(
              "Choose Schedule",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textDark,
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: ListView.separated(
                itemCount: schedules.length,
                separatorBuilder: (_, _) => const Divider(
                  color: AppColors.mintChip,
                  thickness: 1,
                ),
                itemBuilder: (context, index) {
                  return _ScheduleItem(
                    time: schedules[index],
                    onSelect: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => BusSelectionPage(
                            fromLocation: widget.fromLocation,
                            toLocation: widget.toLocation,
                            selectedTime: schedules[index],
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ScheduleItem extends StatelessWidget {
  final String time;
  final VoidCallback onSelect;

  const _ScheduleItem({required this.time, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          const Icon(Icons.history, size: 28, color: AppColors.subtitleGrey),
          const SizedBox(width: 16),
          Text(
            time,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.textDark,
            ),
          ),
          const Spacer(),
          ElevatedButton(
            onPressed: onSelect,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.darkGreen,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
              padding:
                  const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
            child: const Text(
              "Select",
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}

class _LocationCard extends StatelessWidget {
  final String from;
  final String to;

  const _LocationCard({required this.from, required this.to});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.darkGreen,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              const Icon(Icons.location_on, color: Colors.white),
              Container(
                height: 100,
                width: 2,
                color: Colors.white54,
              ),
              const Icon(Icons.location_on_outlined, color: Colors.white),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text("From",
                    style: TextStyle(color: Colors.white70, fontSize: 13)),
                const SizedBox(height: 4),
                _locationBox(from),
                const SizedBox(height: 12),
                const Text("To",
                    style: TextStyle(color: Colors.white70, fontSize: 13)),
                const SizedBox(height: 4),
                _locationBox(to),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _locationBox(String text) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.mintChip,
        borderRadius: BorderRadius.circular(30),
      ),
      child: Text(
        text,
        style: const TextStyle(color: Colors.white, fontSize: 15),
      ),
    );
  }
}
