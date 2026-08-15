import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Persistent storage for session tokens.
///
/// Backed by the iOS Keychain and Android EncryptedSharedPreferences. This is
/// a deliberate replacement for the previous approach, which wrote the user's
/// **raw password** into plain SharedPreferences under `saved_password` — a
/// file readable by any process running as the same user on a rooted device.
///
/// We now store tokens, never the password: a refresh token can be revoked
/// server-side, a password cannot.
class TokenStore {
  static const _accessKey = 'auth_access_token';
  static const _refreshKey = 'auth_refresh_token';

  final FlutterSecureStorage _storage;

  TokenStore([FlutterSecureStorage? storage])
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(
                accessibility: KeychainAccessibility.first_unlock,
              ),
            );

  // Cached in memory so the hot path (attaching a bearer header to every
  // request) does not hit the Keychain on each call.
  String? _accessToken;
  String? _refreshToken;

  String? get accessToken => _accessToken;
  String? get refreshToken => _refreshToken;

  bool get hasSession => _refreshToken != null && _refreshToken!.isNotEmpty;

  /// Load tokens from secure storage into memory. Call once at startup.
  Future<void> restore() async {
    _accessToken = await _storage.read(key: _accessKey);
    _refreshToken = await _storage.read(key: _refreshKey);
  }

  Future<void> save({
    required String accessToken,
    required String refreshToken,
  }) async {
    _accessToken = accessToken;
    _refreshToken = refreshToken;
    await _storage.write(key: _accessKey, value: accessToken);
    await _storage.write(key: _refreshKey, value: refreshToken);
  }

  Future<void> clear() async {
    _accessToken = null;
    _refreshToken = null;
    await _storage.delete(key: _accessKey);
    await _storage.delete(key: _refreshKey);
  }
}
