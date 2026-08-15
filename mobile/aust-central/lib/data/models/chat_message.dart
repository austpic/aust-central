import 'package:flutter/foundation.dart';

/// One message in a book-exchange conversation.
@immutable
class ChatMessage {
  final String? id;
  final String body;

  /// True when this device sent it — drives which side the bubble sits on.
  final bool isMine;
  final DateTime? sentAt;

  const ChatMessage({
    required this.body,
    required this.isMine,
    this.id,
    this.sentAt,
  });

  /// An optimistic message not yet acknowledged by the server.
  factory ChatMessage.pending(String body) =>
      ChatMessage(body: body, isMine: true);

  bool get isPending => id == null;

  /// "9:42 AM", or "Now" while the send is still in flight.
  String get displayTime {
    final at = sentAt;
    if (at == null) return 'Now';
    final local = at.toLocal();
    final hour = local.hour % 12 == 0 ? 12 : local.hour % 12;
    final minute = local.minute.toString().padLeft(2, '0');
    return '$hour:$minute ${local.hour >= 12 ? 'PM' : 'AM'}';
  }

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
        id: json['id'] as String,
        body: json['body'] as String,
        isMine: json['isMine'] as bool? ?? false,
        sentAt: DateTime.parse(json['createdAt'] as String).toLocal(),
      );
}
