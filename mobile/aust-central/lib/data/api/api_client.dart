import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import 'package:aust_track/data/api/api_exception.dart';
import 'package:aust_track/data/api/token_store.dart';

/// The single HTTP entry point for the app.
///
/// Two responsibilities beyond plain requests:
///
///  1. Attach the access token to every call.
///  2. Transparently refresh it once on a 401 and replay the original request,
///     so a 15-minute token expiry is invisible to the user.
///
/// Refresh is guarded by a single in-flight future. Without that, a screen
/// firing several parallel requests would each get a 401 and each try to
/// refresh — and because the server rotates refresh tokens and treats reuse as
/// theft, the second attempt would revoke the whole family and sign the user
/// out. The mutex is what makes rotation safe on a chatty client.
class ApiClient {
  final Dio _dio;
  final TokenStore tokens;

  /// Invoked when the session is unrecoverable and the user must sign in again.
  final Future<void> Function()? onSessionExpired;

  Future<bool>? _refreshInFlight;

  ApiClient({required this.tokens, this.onSessionExpired, Dio? dio})
      : _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: ApiConfig.baseUrl,
                connectTimeout: ApiConfig.connectTimeout,
                receiveTimeout: ApiConfig.receiveTimeout,
                // Deliberately NOT set globally. A bodyless request that still
                // declares `application/json` is rejected by the server with
                // "Body cannot be empty when content-type is set to
                // 'application/json'", which broke every DELETE and every
                // bodyless POST/PUT. The header is attached per request below,
                // only when there is actually a body to describe.
                // We handle status codes ourselves so non-2xx becomes a typed
                // ApiException rather than an opaque throw.
                validateStatus: (status) => status != null && status < 400,
              ),
            ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final token = tokens.accessToken;
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final isAuthCall = error.requestOptions.path.startsWith('/auth/');
          final alreadyRetried = error.requestOptions.extra['__retried'] == true;

          // Only a 401 on a non-auth call is worth refreshing. Retrying a
          // failed login would be pointless, and retrying twice would loop.
          if (error.response?.statusCode != 401 || isAuthCall || alreadyRetried) {
            return handler.next(error);
          }

          final refreshed = await _refreshOnce();
          if (!refreshed) {
            await onSessionExpired?.call();
            return handler.next(error);
          }

          try {
            final options = error.requestOptions;
            options.extra['__retried'] = true;
            options.headers['Authorization'] = 'Bearer ${tokens.accessToken}';
            final response = await _dio.fetch(options);
            return handler.resolve(response);
          } on DioException catch (retryError) {
            return handler.next(retryError);
          }
        },
      ),
    );
  }

  /// Refresh the session, collapsing concurrent callers onto one request.
  Future<bool> _refreshOnce() {
    return _refreshInFlight ??= _performRefresh().whenComplete(() {
      _refreshInFlight = null;
    });
  }

  Future<bool> _performRefresh() async {
    final refreshToken = tokens.refreshToken;
    if (refreshToken == null || refreshToken.isEmpty) return false;

    try {
      // A bare Dio instance: using _dio would re-enter this interceptor.
      final response = await Dio(BaseOptions(baseUrl: ApiConfig.baseUrl)).post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
        options: Options(contentType: Headers.jsonContentType),
      );
      final data = response.data as Map;
      await tokens.save(
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String,
      );
      return true;
    } catch (_) {
      // Expired, revoked, or reuse-detected. Either way the session is gone.
      await tokens.clear();
      return false;
    }
  }

  // --- Verbs ---------------------------------------------------------------

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) =>
      _send(() => _dio.get(path, queryParameters: _clean(query)));

  /// Options carrying the JSON content type, used only when a body is present.
  Options get _json => Options(contentType: Headers.jsonContentType);

  Future<dynamic> post(String path, {Object? body}) => _send(
        () => _dio.post(path, data: body, options: body == null ? null : _json),
      );

  Future<dynamic> patch(String path, {Object? body}) => _send(
        () => _dio.patch(path, data: body, options: body == null ? null : _json),
      );

  Future<dynamic> put(String path, {Object? body}) => _send(
        () => _dio.put(path, data: body, options: body == null ? null : _json),
      );

  Future<dynamic> delete(String path) => _send(() => _dio.delete(path));

  /// Multipart upload, returning the created file's metadata.
  Future<Map<String, dynamic>> uploadFile(String filePath) async {
    final form = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath),
    });
    final result = await _send(() => _dio.post('/files', data: form));
    return Map<String, dynamic>.from(result as Map);
  }

  Future<dynamic> _send(Future<Response> Function() request) async {
    try {
      final response = await request();
      return response.data;
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  /// Drop null query values so they are not serialised as "null".
  Map<String, dynamic>? _clean(Map<String, dynamic>? query) {
    if (query == null) return null;
    final cleaned = <String, dynamic>{};
    query.forEach((key, value) {
      if (value != null) cleaned[key] = value;
    });
    return cleaned.isEmpty ? null : cleaned;
  }
}

/// Where the app looks for the AUST Central API.
///
/// Override at build time without touching source:
///   flutter run --dart-define=API_BASE_URL=http://192.168.0.10:3000/api/v1
class ApiConfig {
  const ApiConfig._();

  static const String _override = String.fromEnvironment('API_BASE_URL');

  /// Base URL including the version prefix.
  ///
  /// The Android emulator reaches the host machine on 10.0.2.2 — on the
  /// emulator `localhost` is the emulated device itself, so a plain localhost
  /// default silently fails to connect. `defaultTargetPlatform` is used rather
  /// than `dart:io`'s `Platform` because the latter throws on web.
  static String get baseUrl {
    if (_override.isNotEmpty) return _override;
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:3000/api/v1';
    }
    return 'http://localhost:3000/api/v1';
  }

  static const Duration connectTimeout = Duration(seconds: 10);
  static const Duration receiveTimeout = Duration(seconds: 20);
}
