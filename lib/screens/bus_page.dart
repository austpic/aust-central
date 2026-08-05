import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'schedule_page.dart';

class BusPage extends StatelessWidget {
  const BusPage({super.key});

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
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: Column(
        children: [
          const SizedBox(height: 8),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: Column(
                children: [
                  const SizedBox(height: 16),
                  LocationCard(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class LocationCard extends StatefulWidget {
  const LocationCard({super.key});

  @override
  State<LocationCard> createState() => _LocationCardState();
}

class _LocationCardState extends State<LocationCard> {
  final List<String> places = [
    "Mirpur",
    "Ansar Camp",
    "Technical",
    "Kalyanpur",
    "Shyamoli",
    "Ring Road",
    "Shia Mashjid",
    "Mohammadpur",
    "Asadgate",
    "Manik Mia",
    "Khamar Bari",
    "Farmgate",
  ];

  String? selectedFrom;
  String? selectedTo;

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
              Container(height: 100, width: 2, color: Colors.white70),
              const Icon(Icons.location_on_outlined, color: Colors.white),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              children: [
                _buildDropdown("From", selectedFrom, (value) {
                  setState(() => selectedFrom = value);
                }),
                const SizedBox(height: 16),
                _buildDropdown("To", selectedTo, (value) {
                  setState(() => selectedTo = value);
                  if (selectedFrom != null && value != null) {
                    final from = selectedFrom!;
                    final to = value;
                    final navigator = Navigator.of(context);
                    Future.microtask(() {
                      if (!mounted) return;
                      navigator.push(
                        MaterialPageRoute(
                          builder: (_) => SchedulePage(
                            fromLocation: from,
                            toLocation: to,
                          ),
                        ),
                      );
                    });
                  }
                }),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDropdown(
    String label,
    String? selectedValue,
    ValueChanged<String?> onChanged,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 14)),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: AppColors.mintChip,
            borderRadius: BorderRadius.circular(30),
          ),
          child: DropdownButton<String>(
            value: selectedValue,
            hint: const Text(
              "Select location",
              style: TextStyle(color: Colors.white70, fontSize: 14),
            ),
            isExpanded: true,
            underline: const SizedBox(),
            dropdownColor: AppColors.darkGreen,
            icon: const Icon(Icons.keyboard_arrow_down, color: Colors.white),
            style: const TextStyle(color: Colors.white, fontSize: 14),
            items: [
              for (String place in places)
                DropdownMenuItem<String>(
                  value: place,
                  child: Text(place),
                ),
            ],
            onChanged: onChanged,
          ),
        ),
      ],
    );
  }
}
