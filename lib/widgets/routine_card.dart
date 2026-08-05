import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class RoutineCard extends StatelessWidget {
  final String time;
  final String period;
  final String title;
  final String teacher;
  final String room;

  const RoutineCard({
    super.key,
    required this.time,
    required this.period,
    required this.title,
    required this.teacher,
    required this.room,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 75,
          height: 93,
          decoration: BoxDecoration(
            color: AppColors.darkGreen,
            borderRadius: BorderRadius.circular(18),
            boxShadow: const [
              BoxShadow(color: Colors.black12, blurRadius: 5)
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                time,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                period,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Container(
            height: 93,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              boxShadow: const [
                BoxShadow(color: Colors.black12, blurRadius: 5)
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textDark,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.person,
                            size: 13, color: AppColors.subtitleGrey),
                        const SizedBox(width: 6),
                        Text(teacher,
                            style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.subtitleGrey)),
                      ],
                    ),
                    Row(
                      children: [
                        const Icon(Icons.location_on,
                            size: 14, color: AppColors.subtitleGrey),
                        const SizedBox(width: 6),
                        Text(room,
                            style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.subtitleGrey)),
                      ],
                    ),
                  ],
                ),
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: AppColors.mintChip,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.arrow_forward_ios,
                    size: 14,
                    color: AppColors.darkGreen,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
