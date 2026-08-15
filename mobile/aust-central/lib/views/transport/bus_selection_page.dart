import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:aust_track/data/repositories/platform_repository.dart';
import 'package:aust_track/viewmodels/transport_view_model.dart';
import 'package:aust_track/theme/app_colors.dart';
import 'package:aust_track/views/widgets/async_views.dart';
import 'package:aust_track/views/transport/receipt_page.dart';

/// Buses serving the chosen origin, destination, and time.
///
/// The three buses here used to be a hardcoded literal shown for every journey,
/// regardless of which stops the student picked. The list now comes from the
/// server, which only returns buses whose route reaches the origin *before* the
/// destination — so the reverse direction correctly shows nothing.
class BusSelectionPage extends StatelessWidget {
  final String fromLocation;
  final String toLocation;
  final String selectedTime;

  const BusSelectionPage({
    super.key,
    required this.fromLocation,
    required this.toLocation,
    required this.selectedTime,
  });

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => BusSelectionViewModel(
        context.read<PlatformRepository>(),
        fromLocation: fromLocation,
        toLocation: toLocation,
      ),
      child: _BusSelectionView(
        fromLocation: fromLocation,
        toLocation: toLocation,
        selectedTime: selectedTime,
      ),
    );
  }
}

class _BusSelectionView extends StatelessWidget {
  final String fromLocation;
  final String toLocation;
  final String selectedTime;

  const _BusSelectionView({
    required this.fromLocation,
    required this.toLocation,
    required this.selectedTime,
  });

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<BusSelectionViewModel>();
    final buses = viewModel.buses;

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
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.darkGreen,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  Column(
                    children: [
                      const Icon(Icons.location_on, color: Colors.white),
                      Container(
                          height: 40, width: 2, color: Colors.white54),
                      const Icon(Icons.location_on_outlined,
                          color: Colors.white),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text("From",
                            style: TextStyle(
                                color: Colors.white70, fontSize: 13)),
                        const SizedBox(height: 4),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: AppColors.mintChip,
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: Text(fromLocation,
                              style: const TextStyle(
                                  color: Colors.white, fontSize: 15)),
                        ),
                        const SizedBox(height: 12),
                        const Text("To",
                            style: TextStyle(
                                color: Colors.white70, fontSize: 13)),
                        const SizedBox(height: 4),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: AppColors.mintChip,
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: Text(toLocation,
                              style: const TextStyle(
                                  color: Colors.white, fontSize: 15)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              "Available Buses:",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textDark,
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: viewModel.isBusy
                  ? const LoadingView()
                  : viewModel.hasError
                  ? ErrorView(
                      message: viewModel.errorMessage!,
                      onRetry: () => viewModel.load(silent: true),
                    )
                  : viewModel.isEmpty
                  ? const EmptyView(
                      icon: Icons.directions_bus_outlined,
                      // Most often means the route runs the other way, or the
                      // chosen day has no service.
                      message: 'No buses serve this route on the selected day',
                    )
                  : ListView.separated(
                itemCount: buses.length,
                separatorBuilder: (context, index) => const Divider(
                  color: AppColors.mintChip,
                  thickness: 1,
                ),
                itemBuilder: (context, index) {
                  final String busName = buses[index]["name"];
                  final String driverNumber = buses[index]["driverNumber"];
                  final List<String> route =
                      List<String>.from(buses[index]["route"]);

                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Row(
                      children: [
                        Container(
                          width: 110,
                          height: 100,
                          decoration: BoxDecoration(
                            color: AppColors.darkGreen,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            busName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            children: [
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => ReceiptPage(
                                          fromLocation: fromLocation,
                                          toLocation: toLocation,
                                          // The bus's real departure time from
                                          // the server, not the slot the user
                                          // tapped on the previous screen.
                                          selectedTime:
                                              buses[index]["departureTime"]
                                                      as String? ??
                                                  selectedTime,
                                          busName: busName,
                                          driverNumber: driverNumber,
                                          route: route,
                                        ),
                                      ),
                                    );
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.darkGreen,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(30),
                                    ),
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 10),
                                  ),
                                  child: const Text("Details",
                                      style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14)),
                                ),
                              ),
                              const SizedBox(height: 6),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: () {
                                    showDialog(
                                      context: context,
                                      builder: (context) => AlertDialog(
                                        shape: RoundedRectangleBorder(
                                            borderRadius:
                                                BorderRadius.circular(20)),
                                        title: Text(busName,
                                            style: const TextStyle(
                                                color: AppColors.darkGreen,
                                                fontWeight: FontWeight.bold)),
                                        content: Text(
                                          route.join(" → "),
                                          style: const TextStyle(
                                              fontSize: 15, height: 1.5),
                                        ),
                                        actions: [
                                          TextButton(
                                            onPressed: () =>
                                                Navigator.pop(context),
                                            child: const Text("Close",
                                                style: TextStyle(
                                                    color:
                                                        AppColors.darkGreen)),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.darkGreen,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(30),
                                    ),
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 10),
                                  ),
                                  child: const Text("Full Route",
                                      style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14)),
                                ),
                              ),
                              const SizedBox(height: 6),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: () {
                                    showDialog(
                                      context: context,
                                      builder: (context) => AlertDialog(
                                        shape: RoundedRectangleBorder(
                                            borderRadius:
                                                BorderRadius.circular(20)),
                                        title: const Text("Driver Contact",
                                            style: TextStyle(
                                                color: AppColors.darkGreen,
                                                fontWeight: FontWeight.bold)),
                                        content: Text(
                                          "$busName\n$driverNumber",
                                          style: const TextStyle(
                                              fontSize: 15, height: 1.5),
                                        ),
                                        actions: [
                                          TextButton(
                                            onPressed: () =>
                                                Navigator.pop(context),
                                            child: const Text("Close",
                                                style: TextStyle(
                                                    color:
                                                        AppColors.darkGreen)),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.darkGreen,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(30),
                                    ),
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 10),
                                  ),
                                  child: const Text("Contact",
                                      style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14)),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
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
