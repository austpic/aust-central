import 'package:dio/dio.dart';

/// A failure the UI can show a user.
///
/// The server replies with a consistent envelope:
///   { "error": { "code", "message", "details": { "fields": {...} } },
///     "requestId": "..." }
///
/// This unwraps it so screens never parse raw Dio errors, and so the message
/// shown is the server's human-readable one rather than "DioException [400]".
class ApiException implements Exception {
  final String message;
  final String code;
  final int? statusCode;

  /// Field-level validation errors, keyed by field name.
  final Map<String, List<String>> fieldErrors;

  /// Echoed by the server on every error — worth surfacing in bug reports.
  final String? requestId;

  const ApiException({
    required this.message,
    this.code = 'UNKNOWN',
    this.statusCode,
    this.fieldErrors = const {},
    this.requestId,
  });

  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isNotFound => statusCode == 404;
  bool get isValidation => statusCode == 422;
  bool get isRateLimited => statusCode == 429;

  /// The first validation message for a field, if any — handy for inline
  /// errors under a text field.
  String? errorFor(String field) => fieldErrors[field]?.first;

  factory ApiException.fromDio(DioException error) {
    // No response at all: DNS failure, refused connection, timeout.
    if (error.response == null) {
      final isTimeout = error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout ||
          error.type == DioExceptionType.sendTimeout;
      return ApiException(
        message: isTimeout
            ? 'The server took too long to respond. Check your connection and try again.'
            : 'Could not reach the server. Check your connection and try again.',
        code: 'NETWORK',
      );
    }

    final status = error.response?.statusCode;
    final data = error.response?.data;

    if (data is Map && data['error'] is Map) {
      final err = data['error'] as Map;
      final details = err['details'];

      final fields = <String, List<String>>{};
      if (details is Map && details['fields'] is Map) {
        (details['fields'] as Map).forEach((key, value) {
          if (value is List) {
            fields[key.toString()] = value.map((v) => v.toString()).toList();
          }
        });
      }

      return ApiException(
        message: (err['message'] ?? 'Something went wrong').toString(),
        code: (err['code'] ?? 'UNKNOWN').toString(),
        statusCode: status,
        fieldErrors: fields,
        requestId: data['requestId']?.toString(),
      );
    }

    return ApiException(
      message: 'Something went wrong. Please try again.',
      code: 'UNKNOWN',
      statusCode: status,
    );
  }

  @override
  String toString() => message;
}
