import 'package:aust_track/data/api/api_client.dart';

/// Dashboard, transport, notifications, and file uploads.
class PlatformRepository {
  final ApiClient _client;
  const PlatformRepository(this._client);

  /// Every counter the home dashboard shows, in one round trip.
  ///
  /// These were hardcoded strings in home_page.dart ('3 due today',
  /// 'Current: 3.72', '14 listings', '2 requests nearby'). They are real now.
  Future<Map<String, dynamic>> dashboard() async {
    final data = await _client.get('/me/dashboard');
    return Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> profile() async {
    final data = await _client.get('/me');
    return Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> updateProfile({
    String? name,
    String? studentId,
    String? department,
  }) async {
    final data = await _client.patch('/me', body: {
      'name': ?name,
      'studentId': ?studentId,
      'department': ?department,
    });
    return Map<String, dynamic>.from(data as Map);
  }

  /// Upload an image, then pin it as the avatar.
  Future<Map<String, dynamic>> setAvatarFromFile(String filePath) async {
    final file = await _client.uploadFile(filePath);
    final data = await _client.put('/me/avatar', body: {'fileId': file['id']});
    return Map<String, dynamic>.from(data as Map);
  }

  /// Upload an image and return its id, for attaching to a listing or report.
  Future<String> uploadImage(String filePath) async {
    final file = await _client.uploadFile(filePath);
    return file['id'] as String;
  }

  // --- Transport -----------------------------------------------------------

  Future<List<Map<String, dynamic>>> stops() async =>
      _list(await _client.get('/transport/stops'));

  Future<List<Map<String, dynamic>>> buses() async =>
      _list(await _client.get('/transport/buses'));

  /// Departures serving [fromStopId] → [toStopId] on [date].
  ///
  /// The server only returns buses whose route reaches the origin before the
  /// destination, so the reverse direction correctly comes back empty.
  Future<List<Map<String, dynamic>>> departures({
    String? fromStopId,
    String? toStopId,
    DateTime? date,
  }) async {
    final data = await _client.get('/transport/departures', query: {
      'from': fromStopId,
      'to': toStopId,
      'date': date?.toUtc().toIso8601String(),
    });
    return _list(data);
  }

  Future<List<Map<String, dynamic>>> notifications({
    bool unreadOnly = false,
    String? type,
  }) async {
    final data = await _client.get('/notifications', query: {
      'unreadOnly': unreadOnly,
      if (type != null) 'type': type,
      'limit': 50,
    });
    return List<Map<String, dynamic>>.from(
      ((data as Map)['items'] as List).map((e) => Map<String, dynamic>.from(e as Map)),
    );
  }

  Future<int> unreadCount() async {
    final data = await _client.get('/notifications/unread-count');
    return (data as Map)['count'] as int;
  }

  Future<void> markRead(String id) => _client.post('/notifications/$id/read');

  Future<void> markAllRead() => _client.post('/notifications/read-all');

  List<Map<String, dynamic>> _list(dynamic data) =>
      List<Map<String, dynamic>>.from(
        (data as List).map((e) => Map<String, dynamic>.from(e as Map)),
      );
}
