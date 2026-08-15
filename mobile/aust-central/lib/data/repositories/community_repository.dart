import 'package:aust_track/data/api/api_client.dart';

/// Notices, blood bank, lost & found, and the book exchange.
class CommunityRepository {
  final ApiClient _client;
  const CommunityRepository(this._client);

  // --- Notices -------------------------------------------------------------

  Future<List<Map<String, dynamic>>> listNotices({String? category, String? search}) async {
    final data = await _client.get('/notices', query: {
      'category': category,
      'search': search,
      'limit': 50,
    });
    return _items(data);
  }

  Future<Map<String, dynamic>?> latestNotice() async {
    final data = await _client.get('/notices/latest');
    return data == null ? null : Map<String, dynamic>.from(data as Map);
  }

  // --- Blood bank ----------------------------------------------------------

  /// Includes server-computed eligibility — the 90-day rule now lives there,
  /// so the client renders the answer instead of deriving its own.
  Future<Map<String, dynamic>> donorProfile() async {
    final data = await _client.get('/blood/donor-profile');
    return Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> updateDonorProfile({
    bool? available,
    String? bloodGroup,
    DateTime? lastDonated,
  }) async {
    final data = await _client.put('/blood/donor-profile', body: {
      'available': ?available,
      'bloodGroup': ?bloodGroup,
      if (lastDonated != null) 'lastDonated': lastDonated.toUtc().toIso8601String(),
    });
    return Map<String, dynamic>.from(data as Map);
  }

  Future<List<Map<String, dynamic>>> bloodRequests({
    String status = 'OPEN',
    String? bloodGroup,
    bool mine = false,
  }) async {
    final data = await _client.get('/blood/requests', query: {
      'status': status,
      'bloodGroup': bloodGroup,
      'mine': mine,
      'limit': 50,
    });
    return _items(data);
  }

  Future<Map<String, dynamic>> createBloodRequest({
    required String patientName,
    required String bloodGroup,
    required String hospital,
    required int units,
    required String urgency,
    required DateTime requiredBy,
    required String contactNumber,
    String location = '',
    String notes = '',
  }) async {
    final data = await _client.post('/blood/requests', body: {
      'patientName': patientName,
      'bloodGroup': bloodGroup,
      'hospital': hospital,
      'location': location,
      'units': units,
      'urgency': urgency,
      'requiredBy': requiredBy.toUtc().toIso8601String(),
      'contactNumber': contactNumber,
      'notes': notes,
    });
    return Map<String, dynamic>.from(data as Map);
  }

  Future<void> setBloodRequestStatus(String id, String status) =>
      _client.patch('/blood/requests/$id', body: {'status': status});

  // --- Lost & found --------------------------------------------------------

  /// Search and category filtering happen server-side now.
  Future<List<Map<String, dynamic>>> lostFoundItems({
    String? search,
    String? category,
    String? kind,
    bool mine = false,
  }) async {
    final data = await _client.get('/lost-found', query: {
      'search': search,
      'category': category,
      'kind': kind,
      'mine': mine,
      'limit': 50,
    });
    return _items(data);
  }

  Future<List<String>> lostFoundCategories() async {
    final data = await _client.get('/lost-found/categories');
    return List<String>.from(data as List);
  }

  Future<Map<String, dynamic>> reportLostFound({
    required String name,
    required String kind,
    required String category,
    required DateTime occurredOn,
    String color = '',
    String room = '',
    String description = '',
    List<String> imageIds = const [],
  }) async {
    final data = await _client.post('/lost-found', body: {
      'name': name,
      'kind': kind,
      'category': category,
      'occurredOn': occurredOn.toUtc().toIso8601String(),
      'color': color,
      'room': room,
      'description': description,
      'imageIds': imageIds,
    });
    return Map<String, dynamic>.from(data as Map);
  }

  // --- Book exchange -------------------------------------------------------

  /// [tab] is browse | mine | saved; [sort] mirrors the filter row.
  Future<List<Map<String, dynamic>>> listings({
    String tab = 'browse',
    String sort = 'recent',
    String? search,
    String? department,
    String? courseCode,
  }) async {
    final data = await _client.get('/books/listings', query: {
      'tab': tab,
      'sort': sort,
      'search': search,
      'department': department,
      'courseCode': courseCode,
      'limit': 50,
    });
    return _items(data);
  }

  Future<Map<String, dynamic>> listing(String id) async {
    final data = await _client.get('/books/listings/$id');
    return Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> createListing({
    required String title,
    required String courseCode,
    required String department,
    required String semester,
    required String condition,
    required String listingType,
    int? priceBdt,
    String description = '',
    List<String> imageIds = const [],
  }) async {
    final data = await _client.post('/books/listings', body: {
      'title': title,
      'courseCode': courseCode,
      'department': department,
      'semester': semester,
      'condition': condition,
      'listingType': listingType,
      // The server rejects a price on SWAP/FREE, so only send it for SALE.
      if (listingType == 'SALE') 'priceBdt': priceBdt,
      'description': description,
      'imageIds': imageIds,
    });
    return Map<String, dynamic>.from(data as Map);
  }

  Future<void> deleteListing(String id) => _client.delete('/books/listings/$id');

  Future<void> setBookmark(String listingId, bool saved) => saved
      ? _client.put('/books/listings/$listingId/bookmark')
      : _client.delete('/books/listings/$listingId/bookmark');

  Future<List<Map<String, dynamic>>> conversations() async {
    final data = await _client.get('/books/conversations', query: {'limit': 50});
    return _items(data);
  }

  Future<Map<String, dynamic>> startConversation(String listingId) async {
    final data = await _client.post('/books/conversations',
        body: {'listingId': listingId});
    return Map<String, dynamic>.from(data as Map);
  }

  /// Newest first — the chat view reverses for display.
  Future<List<Map<String, dynamic>>> messages(String conversationId) async {
    final data = await _client.get(
      '/books/conversations/$conversationId/messages',
      query: {'limit': 50},
    );
    return _items(data);
  }

  Future<Map<String, dynamic>> sendMessage(String conversationId, String body) async {
    final data = await _client.post(
      '/books/conversations/$conversationId/messages',
      body: {'body': body},
    );
    return Map<String, dynamic>.from(data as Map);
  }

  Future<void> markConversationRead(String conversationId) =>
      _client.post('/books/conversations/$conversationId/read');

  Future<List<Map<String, dynamic>>> sellerReviews(String sellerId) async {
    final data = await _client.get('/books/sellers/$sellerId/reviews',
        query: {'limit': 50});
    return _items(data);
  }

  List<Map<String, dynamic>> _items(dynamic data) =>
      List<Map<String, dynamic>>.from(
        ((data as Map)['items'] as List).map((e) => Map<String, dynamic>.from(e as Map)),
      );
}
