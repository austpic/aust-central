import 'package:aust_track/core/base_view_model.dart';
import 'package:aust_track/data/repositories/platform_repository.dart';

/// Bus stop picker.
///
/// Stops are reference data owned by the server, so adding one is an
/// operations change rather than an app release.
class BusStopsViewModel extends BaseViewModel {
  final PlatformRepository _repo;

  BusStopsViewModel(this._repo) {
    load();
  }

  /// Used only if the stop list cannot be fetched, so the picker is never
  /// completely empty on a flaky connection.
  static const _fallback = [
    'Mirpur', 'Ansar Camp', 'Technical', 'Kalyanpur', 'Shyamoli', 'Ring Road',
    'Shia Mashjid', 'Mohammadpur', 'Asadgate', 'Manik Mia', 'Khamar Bari',
    'Farmgate',
  ];

  List<String> _places = _fallback;
  String? selectedFrom;
  String? selectedTo;

  List<String> get places => List.unmodifiable(_places);
  bool get canContinue => selectedFrom != null && selectedTo != null;

  void setFrom(String? value) {
    selectedFrom = value;
    safeNotify();
  }

  void setTo(String? value) {
    selectedTo = value;
    safeNotify();
  }

  Future<void> load() async {
    // Deliberately does not surface an error state: the fallback list keeps
    // the picker usable offline, which is better than blocking the screen.
    await runAction(() async {
      final stops = await _repo.stops();
      _places = stops.map((s) => s['name'] as String).toList();
    });
    safeNotify();
  }
}

/// Buses serving a chosen origin → destination pair.
///
/// The server only returns buses whose route reaches the origin *before* the
/// destination, so the reverse direction correctly comes back empty even
/// though the bus visits both stops.
class BusSelectionViewModel extends BaseViewModel {
  final PlatformRepository _repo;
  final String fromLocation;
  final String toLocation;

  BusSelectionViewModel(
    this._repo, {
    required this.fromLocation,
    required this.toLocation,
  }) {
    load();
  }

  List<Map<String, dynamic>> _buses = [];

  List<Map<String, dynamic>> get buses => List.unmodifiable(_buses);
  bool get isEmpty => _buses.isEmpty;

  Future<void> load({bool silent = false}) => runLoad(() async {
        final stops = await _repo.stops();
        String? idFor(String name) => stops
            .cast<Map<String, dynamic>?>()
            .firstWhere((s) => s?['name'] == name, orElse: () => null)?['id']
            as String?;

        final departures = await _repo.departures(
          fromStopId: idFor(fromLocation),
          toStopId: idFor(toLocation),
        );

        _buses = departures.map((d) {
          final bus = d['bus'] as Map<String, dynamic>;
          return {
            'name': bus['name'] as String,
            'driverNumber': bus['driverNumber'] as String,
            'route': (bus['route'] as List)
                .map((s) => (s as Map)['name'] as String)
                .toList(),
            'departureTime': d['departureTime'] as String,
          };
        }).toList();
      }, silent: silent);
}
