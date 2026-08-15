import 'package:aust_track/core/base_view_model.dart';
import 'package:aust_track/data/models/chat_message.dart';
import 'package:aust_track/data/repositories/community_repository.dart';

/// Buyer ↔ seller chat for one listing.
///
/// The server keys conversations on (listing, buyer), so opening the thread is
/// idempotent — reopening never forks a new one. Access is checked server-side:
/// a third party holding the conversation id gets a 404 on read and write.
class ChatViewModel extends BaseViewModel {
  final CommunityRepository _repo;
  final String? listingId;

  ChatViewModel(this._repo, {required this.listingId}) {
    open();
  }

  final List<ChatMessage> _messages = [];
  String? _conversationId;
  bool _sending = false;

  List<ChatMessage> get messages => List.unmodifiable(_messages);
  bool get isSending => _sending;
  bool get canSend => _conversationId != null && !_sending;
  bool get isEmpty => _messages.isEmpty;

  Future<void> open() => runLoad(() async {
        if (listingId == null) {
          // Without a listing there is nothing to key a conversation on.
          throw const _NoListing();
        }

        final conversation = await _repo.startConversation(listingId!);
        _conversationId = conversation['id'] as String;

        final rows = await _repo.messages(_conversationId!);
        _messages
          ..clear()
          // The API pages newest-first; a transcript reads oldest-first.
          ..addAll(rows.reversed.map(ChatMessage.fromJson));

        // Clearing the badge is best-effort — failing it must not break the view.
        await _repo.markConversationRead(_conversationId!).catchError((_) {});
      });

  /// @returns null on success, or a message for the view to surface.
  Future<String?> send(String text) async {
    final body = text.trim();
    if (body.isEmpty || _conversationId == null || _sending) return null;

    // Optimistic: the bubble appears immediately and is removed if the send
    // fails, so the thread never shows a message that was not delivered.
    final pending = ChatMessage.pending(body);
    _messages.add(pending);
    _sending = true;
    safeNotify();

    Map<String, dynamic>? sent;
    final failure = await runAction(() async {
      sent = await _repo.sendMessage(_conversationId!, body);
    });

    final index = _messages.indexOf(pending);
    if (failure != null) {
      if (index != -1) _messages.removeAt(index);
    } else if (sent != null && index != -1) {
      _messages[index] = ChatMessage.fromJson(sent!);
    }

    _sending = false;
    safeNotify();
    return failure;
  }
}

/// Sentinel turned into a friendly message by [BaseViewModel.runLoad].
class _NoListing implements Exception {
  const _NoListing();
  @override
  String toString() => 'Open a chat from a listing to message this seller.';
}
