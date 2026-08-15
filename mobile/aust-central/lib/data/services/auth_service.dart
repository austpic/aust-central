import 'package:flutter/foundation.dart';

import 'package:aust_track/data/api/api_client.dart';
import 'package:aust_track/data/api/api_exception.dart';
import 'package:aust_track/data/api/token_store.dart';
import 'package:aust_track/data/models/app_user.dart';

/// Authentication against the AUST Central API.
///
/// This replaces the previous Firebase-backed implementation. The public shape
/// is intentionally close to the old one so the login and register screens
/// needed only small edits, but the mechanics are different:
///
///  - Credentials go to our server, which returns an access + refresh pair.
///  - Tokens are held in the Keychain via [TokenStore]; the password is never
///    persisted anywhere on the device.
///  - `authStateChanges` is a ChangeNotifier rather than a Firebase stream.
class AuthService extends ChangeNotifier {
  final ApiClient client;
  final TokenStore tokens;

  AppUser? _currentUser;
  bool _restoring = true;

  AuthService({required this.client, required this.tokens});

  AppUser? get currentUser => _currentUser;
  bool get isSignedIn => _currentUser != null;

  /// True until the stored session has been checked at startup. The splash
  /// screen waits on this so a returning user is not flashed the login page.
  bool get isRestoring => _restoring;

  /// Restore a session from secure storage, if one is still valid.
  ///
  /// This is the fix for the old behaviour where every cold start dropped the
  /// user back at the welcome screen even with a valid session.
  Future<void> restoreSession() async {
    _restoring = true;
    try {
      await tokens.restore();
      if (!tokens.hasSession) {
        _currentUser = null;
        return;
      }
      // /me both validates the token and gives us the fresh user row. If the
      // access token has expired the client refreshes transparently; if the
      // refresh token is dead too, this throws and we fall back to signed-out.
      final data = await client.get('/me');
      _currentUser = AppUser.fromJson(Map<String, dynamic>.from(data as Map));
    } catch (_) {
      await tokens.clear();
      _currentUser = null;
    } finally {
      _restoring = false;
      notifyListeners();
    }
  }

  Future<AppUser> signIn({
    required String email,
    required String password,
  }) async {
    final data = await client.post('/auth/login', body: {
      'email': email,
      'password': password,
    });
    return _adoptSession(data as Map);
  }

  Future<AppUser> register({
    required String name,
    required String email,
    required String password,
    String? studentId,
    String? department,
  }) async {
    final data = await client.post('/auth/register', body: {
      'name': name,
      'email': email,
      'password': password,
      if (studentId != null && studentId.isNotEmpty) 'studentId': studentId,
      if (department != null && department.isNotEmpty) 'department': department,
    });
    return _adoptSession(data as Map);
  }

  Future<void> sendPasswordResetEmail({required String email}) async {
    await client.post('/auth/forgot-password', body: {'email': email});
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await client.patch('/auth/password', body: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
    // The server revokes every session on a password change, so the local one
    // is already dead — clear it rather than let the next call 401.
    await signOut();
  }

  Future<void> signOut() async {
    try {
      await client.post('/auth/logout', body: {
        'refreshToken': tokens.refreshToken,
      });
    } on ApiException {
      // Already invalid server-side; clearing locally is what matters.
    }
    await tokens.clear();
    _currentUser = null;
    notifyListeners();
  }

  Future<AppUser> refreshProfile() async {
    final data = await client.get('/me');
    _currentUser = AppUser.fromJson(Map<String, dynamic>.from(data as Map));
    notifyListeners();
    return _currentUser!;
  }

  Future<AppUser> _adoptSession(Map data) async {
    await tokens.save(
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
    );
    _currentUser = AppUser.fromJson(Map<String, dynamic>.from(data['user'] as Map));
    notifyListeners();
    return _currentUser!;
  }

  /// Kept for source compatibility with the screens, which used to translate
  /// Firebase error codes. Our API already returns human-readable messages, so
  /// this just passes them through.
  String getErrorMessage(Object error) {
    if (error is ApiException) return error.message;
    return 'Something went wrong. Please try again.';
  }
}
