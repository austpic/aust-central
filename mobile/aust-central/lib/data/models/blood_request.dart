import 'package:flutter/material.dart';

enum BloodUrgency {
  routine,
  urgent,
  critical;

  static BloodUrgency fromName(String? raw) {
    switch (raw) {
      case 'urgent':
        return BloodUrgency.urgent;
      case 'critical':
        return BloodUrgency.critical;
      case 'routine':
      default:
        return BloodUrgency.routine;
    }
  }

  String get label {
    switch (this) {
      case BloodUrgency.routine:
        return 'Routine';
      case BloodUrgency.urgent:
        return 'Urgent';
      case BloodUrgency.critical:
        return 'Critical';
    }
  }
}

@immutable
class BloodRequest {
  final String id;
  final String patientName;
  final String bloodGroup;
  final String hospital;
  final String location;
  final int units;
  final BloodUrgency urgency;
  final DateTime requiredBy;
  final String contactNumber;
  final String notes;

  const BloodRequest({
    required this.id,
    required this.patientName,
    required this.bloodGroup,
    required this.hospital,
    required this.location,
    required this.units,
    required this.urgency,
    required this.requiredBy,
    required this.contactNumber,
    this.notes = '',
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'patientName': patientName,
        'bloodGroup': bloodGroup,
        'hospital': hospital,
        'location': location,
        'units': units,
        'urgency': urgency.name,
        'requiredBy': requiredBy.toIso8601String(),
        'contactNumber': contactNumber,
        'notes': notes,
      };

  factory BloodRequest.fromJson(Map<String, dynamic> json) => BloodRequest(
        id: json['id'] as String,
        patientName: json['patientName'] as String,
        bloodGroup: json['bloodGroup'] as String,
        hospital: json['hospital'] as String,
        location: json['location'] as String? ?? '',
        units: (json['units'] as num).toInt(),
        urgency: BloodUrgency.fromName(json['urgency'] as String?),
        requiredBy: DateTime.parse(json['requiredBy'] as String),
        contactNumber: json['contactNumber'] as String,
        notes: json['notes'] as String? ?? '',
      );

  /// Two-letter initials used in the request card avatar.
  String get initials {
    final parts =
        patientName.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty);
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first.substring(0, 1) + parts.last.substring(0, 1))
        .toUpperCase();
  }
}
