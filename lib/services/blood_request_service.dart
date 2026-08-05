import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/blood_request.dart';

/// In-memory + SharedPreferences-backed list of outgoing blood requests the
/// user has submitted from the Blood Bank screen. Kept here so the form and
/// the bank list share a single source of truth — and so a request submitted
/// during this session survives a screen pop.
class BloodRequestService {
  BloodRequestService._();

  static const _kMyRequests = 'bb_my_requests_v1';

  /// Hardcoded network-visible requests the user sees on the bank screen.
  /// These are deliberate fixtures — replace when a backend is wired.
  static List<BloodRequest> seedRequests() => [
        BloodRequest(
          id: 'seed_1',
          patientName: 'Nazia Rahman',
          bloodGroup: 'A+',
          hospital: 'Square Hospital',
          location: 'Panthapath, Dhaka',
          units: 2,
          urgency: BloodUrgency.critical,
          requiredBy: DateTime.now().add(const Duration(hours: 6)),
          contactNumber: '+8801711122334',
          notes: 'ICU admission — needs platelets too',
        ),
        BloodRequest(
          id: 'seed_2',
          patientName: 'Rakib Hasan',
          bloodGroup: 'O-',
          hospital: 'AUST Medical Center',
          location: 'Campus',
          units: 1,
          urgency: BloodUrgency.urgent,
          requiredBy: DateTime.now().add(const Duration(days: 1)),
          contactNumber: '+8801922334455',
          notes: '',
        ),
        BloodRequest(
          id: 'seed_3',
          patientName: 'Tasnim Akter',
          bloodGroup: 'B+',
          hospital: 'United Hospital',
          location: 'Gulshan, Dhaka',
          units: 3,
          urgency: BloodUrgency.routine,
          requiredBy: DateTime.now().add(const Duration(days: 3)),
          contactNumber: '+8801555667788',
          notes: 'Surgery scheduled',
        ),
        BloodRequest(
          id: 'seed_4',
          patientName: 'Imran Chowdhury',
          bloodGroup: 'AB+',
          hospital: 'Lab Aid Hospital',
          location: 'Dhanmondi, Dhaka',
          units: 2,
          urgency: BloodUrgency.urgent,
          requiredBy: DateTime.now().add(const Duration(days: 2)),
          contactNumber: '+8801611990022',
          notes: '',
        ),
      ];

  static Future<List<BloodRequest>> loadMyRequests() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_kMyRequests);
    if (raw == null || raw.isEmpty) return const [];
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List) return const [];
      return decoded
          .whereType<Map<String, dynamic>>()
          .map(BloodRequest.fromJson)
          .toList();
    } catch (_) {
      // Corrupt blob — drop it so we don't crash the screen.
      await prefs.remove(_kMyRequests);
      return const [];
    }
  }

  static Future<void> saveMyRequests(List<BloodRequest> requests) async {
    final prefs = await SharedPreferences.getInstance();
    final encoded = jsonEncode(requests.map((r) => r.toJson()).toList());
    await prefs.setString(_kMyRequests, encoded);
  }

  static Future<void> addRequest(BloodRequest request) async {
    final current = await loadMyRequests();
    final next = [request, ...current];
    await saveMyRequests(next);
  }

  static Future<void> removeRequest(String id) async {
    final current = await loadMyRequests();
    final next = current.where((r) => r.id != id).toList();
    await saveMyRequests(next);
  }
}
