import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

/// In-app chat screen. Reused from both the book-detail page and a
/// seller's profile page — both just push this with the seller's id/name
/// (and optionally the book being discussed).
///
/// NOTE: still UI-only. Messages are local/static for now; wiring to a
/// real backend/socket comes in the next pass.
class InAppChatPage extends StatefulWidget {
  final String sellerId;
  final String sellerName;
  final String sellerSubtitle; // e.g. "Online • Biology Dept"
  final String? sellerAvatarUrl;

  // Optional — only shown when navigating from a book listing.
  final String? bookTitle;
  final String? bookSubtitle; // e.g. "BIO 150 • Swap Offered"
  final String? bookImageUrl;

  const InAppChatPage({
    super.key,
    required this.sellerId,
    required this.sellerName,
    this.sellerSubtitle = 'Offline',
    this.sellerAvatarUrl,
    this.bookTitle,
    this.bookSubtitle,
    this.bookImageUrl,
  });

  @override
  State<InAppChatPage> createState() => _InAppChatPageState();
}

class _ChatMessage {
  final String text;
  final String sender; // 'me' | 'them'
  final String time;

  _ChatMessage({required this.text, required this.sender, required this.time});
}

class _InAppChatPageState extends State<InAppChatPage> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();

  // Static sample data matching the mockup — replace with real
  // conversation data in the full implementation.
  final List<_ChatMessage> _messages = [
    _ChatMessage(
      text:
      'Hello Professor! Is the Botany textbook still available for swap? I have the Chemistry textbook you requested.',
      sender: 'me',
      time: '9:42 AM',
    ),
    _ChatMessage(
      text:
      "Yes, it is still available. The Chemistry structure book is exactly what I need for next semester's class!",
      sender: 'them',
      time: '9:44 AM',
    ),
  ];

  final List<String> _quickReplies = const [
    'Still available?',
    'Meet at library?',
    'Take a swap?',
  ];

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _send() {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _messages.add(_ChatMessage(text: text, sender: 'me', time: 'Now'));
      _messageController.clear();
    });
    // TODO: send to backend / socket
  }

  @override
  Widget build(BuildContext context) {
    final hasBook = widget.bookTitle != null;

    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      body: SafeArea(
        child: Column(
          children: [
            _buildAppBar(context),
            if (hasBook) _buildBookBanner(),
            Expanded(
              child: _messages.isEmpty
                  ? const Center(
                child: Text(
                  'Say hi to start the conversation',
                  style: TextStyle(color: Colors.black45),
                ),
              )
                  : ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                itemCount: _messages.length,
                itemBuilder: (context, index) {
                  return _buildMessageBubble(_messages[index]);
                },
              ),
            ),
            _buildQuickReplies(),
            _buildInputBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.darkGreen),
            onPressed: () => Navigator.of(context).maybePop(),
          ),
          CircleAvatar(
            radius: 20,
            backgroundColor: AppColors.mintSection,
            backgroundImage: widget.sellerAvatarUrl != null
                ? NetworkImage(widget.sellerAvatarUrl!)
                : null,
            child: widget.sellerAvatarUrl == null
                ? const Icon(Icons.person, color: Colors.white)
                : null,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  widget.sellerName,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textDark,
                  ),
                ),
                Text(
                  widget.sellerSubtitle,
                  style: const TextStyle(
                    fontSize: 12.5,
                    color: Colors.black54,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.call_outlined, color: AppColors.darkGreen),
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildBookBanner() {
    return Container(
      color: AppColors.mintSection,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: widget.bookImageUrl != null
                ? Image.network(
              widget.bookImageUrl!,
              width: 40,
              height: 52,
              fit: BoxFit.cover,
            )
                : Container(
              width: 40,
              height: 52,
              decoration: BoxDecoration(
                color: AppColors.darkGreen,
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Icon(
                Icons.menu_book,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  widget.bookTitle ?? '',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                  ),
                ),
                if (widget.bookSubtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    widget.bookSubtitle!,
                    style: const TextStyle(fontSize: 12, color: Colors.black54),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.darkGreen,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
            ),
            child: const Text(
              'View Detail',
              style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(_ChatMessage message) {
    final isMe = message.sender == 'me';
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Column(
        crossAxisAlignment:
        isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Container(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.72,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: isMe ? AppColors.darkGreen : AppColors.mintChip,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(16),
                topRight: const Radius.circular(16),
                bottomLeft: Radius.circular(isMe ? 16 : 4),
                bottomRight: Radius.circular(isMe ? 4 : 16),
              ),
            ),
            child: Text(
              message.text,
              style: TextStyle(
                fontSize: 14,
                height: 1.35,
                color: isMe ? Colors.white : AppColors.textDark,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              message.time,
              style: const TextStyle(fontSize: 11, color: Colors.black45),
            ),
          ),
          const SizedBox(height: 6),
        ],
      ),
    );
  }

  Widget _buildQuickReplies() {
    return Container(
      color: AppColors.scaffoldBackground,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: SizedBox(
        height: 34,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: _quickReplies.length,
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemBuilder: (context, index) {
            final reply = _quickReplies[index];
            return ActionChip(
              label: Text(
                reply,
                style: const TextStyle(
                  fontSize: 12.5,
                  color: AppColors.darkGreen,
                  fontWeight: FontWeight.w600,
                ),
              ),
              backgroundColor: AppColors.mintChip,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide.none,
              ),
              onPressed: () {
                _messageController.text = reply;
              },
            );
          },
        ),
      ),
    );
  }

  Widget _buildInputBar() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            IconButton(
              icon: const Icon(Icons.add_circle_outline, color: Colors.black45),
              onPressed: () {},
            ),
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: AppColors.mintSection.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _messageController,
                        decoration: const InputDecoration(
                          hintText: 'Type a message...',
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    const Icon(
                      Icons.emoji_emotions_outlined,
                      color: Colors.black38,
                      size: 20,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 20,
              backgroundColor: AppColors.darkGreen,
              child: IconButton(
                icon: const Icon(Icons.send_rounded, color: Colors.white, size: 18),
                onPressed: _send,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
