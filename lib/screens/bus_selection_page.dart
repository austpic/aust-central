import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'receipt_page.dart';

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
    final List<Map<String, dynamic>> buses = [
      {
        "name": "Meghna - 1",
        "driverNumber": "+880 1711-000001",
        "route": ["Farmgate", "Bijoy Sarani", "Mohakhali", "Aust"],
      },
      {
        "name": "Jamuna - 2",
        "driverNumber": "+880 1711-000002",
        "route": ["Farmgate", "Banani", "Mohakhali", "Aust"],
      },
      {
        "name": "Padma - 1",
        "driverNumber": "+880 1711-000003",
        "route": ["Farmgate", "Bijoy Sarani", "Gulshan", "Aust"],
      },
    ];

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
              child: ListView.separated(
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
                                          selectedTime: selectedTime,
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
                                  child: const Text("Select",
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
