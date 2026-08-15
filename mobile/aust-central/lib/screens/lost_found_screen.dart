import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class LostFoundScreen extends StatefulWidget {
  const LostFoundScreen({super.key});

  @override
  State<LostFoundScreen> createState() => _LostFoundScreenState();
}

class _LostFoundScreenState extends State<LostFoundScreen> {
  String _search = '';
  String _selectedCategory = 'All';

  static const List<String> _categories = [
    'All',
    'Bags',
    'Bottle',
    'ID Card',
    'Umbrella',
    'Electronics',
    'Mobile',
    'Charger',
    'Others',
  ];

  static const List<Map<String, String>> _allItems = [
    {
      'name': 'Backpack',
      'date': '27 Feb 2025',
      'color': 'Black',
      'room': '7A06',
      'category': 'Bags',
    },
    {
      'name': 'Bottle',
      'date': '25 Jan 2025',
      'color': 'Blue',
      'room': '4C02',
      'category': 'Bottle',
    },
    {
      'name': 'ID Card',
      'date': '15 Apr 2024',
      'color': 'N/A',
      'room': 'N/A',
      'category': 'ID Card',
    },
    {
      'name': 'Umbrella',
      'date': '15 Apr 2024',
      'color': 'Grey',
      'room': 'N/A',
      'category': 'Umbrella',
    },
    {
      'name': 'Charger',
      'date': '10 Mar 2025',
      'color': 'White',
      'room': 'Library',
      'category': 'Charger',
    },
  ];

  List<Map<String, String>> get _filtered {
    final query = _search.trim().toLowerCase();
    return _allItems.where((i) {
      final matchesCategory =
          _selectedCategory == 'All' || i['category'] == _selectedCategory;
      final matchesSearch =
          query.isEmpty || (i['name'] ?? '').toLowerCase().contains(query);
      return matchesCategory && matchesSearch;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textDark),
        title: const Text(
          "Lost & Found",
          style: TextStyle(
            color: AppColors.darkGreen,
            fontSize: 22,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: TextField(
              onChanged: (value) => setState(() => _search = value),
              decoration: InputDecoration(
                hintText: "Search items...",
                hintStyle: const TextStyle(color: AppColors.subtitleGrey),
                prefixIcon: const Icon(Icons.search, color: AppColors.subtitleGrey),
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(15),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 40,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _categories.length,
              itemBuilder: (context, index) {
                final category = _categories[index];
                final isSelected = _selectedCategory == category;
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: ChoiceChip(
                    label: Text(category),
                    selected: isSelected,
                    selectedColor: AppColors.darkGreen,
                    backgroundColor: AppColors.mintChip,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : AppColors.textDark,
                      fontWeight:
                          isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                    onSelected: (bool selected) {
                      setState(() {
                        _selectedCategory = category;
                      });
                    },
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: filtered.isEmpty
                ? const Center(
                    child: Text(
                      "No items match your search.",
                      style: TextStyle(color: AppColors.subtitleGrey),
                    ),
                  )
                : ListView.builder(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final i = filtered[index];
                      return ItemCard(
                        name: i['name']!,
                        date: i['date']!,
                        color: i['color']!,
                        room: i['room']!,
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class ItemCard extends StatelessWidget {
  final String name, date, color, room;
  const ItemCard({
    super.key,
    required this.name,
    required this.date,
    required this.color,
    required this.room,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.mintChip,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(15),
            ),
            child: const Icon(Icons.inventory_2_outlined,
                color: AppColors.darkGreen, size: 28),
          ),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textDark)),
                const SizedBox(height: 4),
                Text("Found: $date",
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.subtitleGrey)),
                Text("Color: $color",
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.subtitleGrey)),
                Text("Room: $room",
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.subtitleGrey)),
              ],
            ),
          ),
          TextButton(
            onPressed: () {},
            style: TextButton.styleFrom(
              backgroundColor: AppColors.darkGreen,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text("Details", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
