import 'package:flutter/material.dart';
import 'package:aust_track/theme/app_colors.dart';

/// Bus route and schedule detail.
///
/// Not a ticket: campus buses are not booked or reserved. This screen exists
/// to answer "which bus, which stops, what time, and who do I call" — so it
/// shows the route and the driver's number, and confirms nothing.
class ReceiptPage extends StatelessWidget {
  final String fromLocation;
  final String toLocation;
  final String selectedTime;
  final String busName;
  final String driverNumber;
  final List<String> route;

  const ReceiptPage({
    super.key,
    required this.fromLocation,
    required this.toLocation,
    required this.selectedTime,
    required this.busName,
    required this.driverNumber,
    required this.route,
  });

  @override
  Widget build(BuildContext context) {
    final routeString = route.join(" → ");

    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textDark),
        title: const Text(
          "Bus Details",
          style: TextStyle(
            color: AppColors.darkGreen,
            fontSize: 22,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 30),
        child: Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.mintChip, width: 1.5),
          ),
          child: Column(
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                    vertical: 20, horizontal: 24),
                decoration: const BoxDecoration(
                  color: AppColors.darkGreen,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(22),
                    topRight: Radius.circular(22),
                  ),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.directions_bus,
                        color: Colors.white, size: 36),
                    const SizedBox(height: 6),
                    Text(
                      busName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      "Route & Schedule",
                      style: TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                  ],
                ),
              ),
              _dottedDivider(),
              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    _receiptRow(Icons.location_on, "From", fromLocation),
                    const SizedBox(height: 16),
                    _receiptRow(Icons.location_on_outlined, "To", toLocation),
                    const SizedBox(height: 16),
                    _receiptRow(
                        Icons.access_time, "Departure", selectedTime),
                    const SizedBox(height: 16),
                    _receiptRow(
                        Icons.phone, "Driver Number", driverNumber),
                    const SizedBox(height: 20),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.mintSection,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.route,
                                  color: AppColors.darkGreen, size: 18),
                              SizedBox(width: 6),
                              Text(
                                "Route",
                                style: TextStyle(
                                  color: AppColors.darkGreen,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(
                            routeString,
                            style: const TextStyle(
                              fontSize: 14,
                              color: AppColors.textDark,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: const BoxDecoration(
                  color: AppColors.mintSection,
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(22),
                    bottomRight: Radius.circular(22),
                  ),
                ),
                child: const Center(
                  child: Text(
                    "Please be present timely at your location!",
                    style: TextStyle(
                      color: AppColors.darkGreen,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _receiptRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: AppColors.darkGreen, size: 20),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style:
                    const TextStyle(color: AppColors.subtitleGrey, fontSize: 12)),
            const SizedBox(height: 2),
            Text(value,
                style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textDark)),
          ],
        ),
      ],
    );
  }

  Widget _dottedDivider() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: List.generate(
          30,
          (index) => Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 2),
              height: 1.5,
              color: index.isEven ? AppColors.mintChip : Colors.transparent,
            ),
          ),
        ),
      ),
    );
  }
}
