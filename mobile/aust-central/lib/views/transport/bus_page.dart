import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:aust_track/data/repositories/platform_repository.dart';
import 'package:aust_track/viewmodels/transport_view_model.dart';
import 'package:aust_track/theme/app_colors.dart';
import 'package:aust_track/views/transport/schedule_page.dart';

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

class LocationCard extends StatelessWidget {
  const LocationCard({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => BusStopsViewModel(context.read<PlatformRepository>()),
      child: const _LocationCardView(),
    );
  }
}

class _LocationCardView extends StatelessWidget {
  const _LocationCardView();

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<BusStopsViewModel>();
    final places = viewModel.places;

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
                _buildDropdown("From", viewModel.selectedFrom, (value) {
                  viewModel.setFrom(value);
                }, places),
                const SizedBox(height: 16),
                _buildDropdown("To", viewModel.selectedTo, (value) {
                  viewModel.setTo(value);
                  if (viewModel.selectedFrom != null && value != null) {
                    final from = viewModel.selectedFrom!;
                    final to = value;
                    final navigator = Navigator.of(context);
                    Future.microtask(() {
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
                }, places),
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
    List<String> places,
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
