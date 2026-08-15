import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:aust_track/data/models/chat_message.dart';
import 'package:aust_track/data/repositories/community_repository.dart';
import 'package:aust_track/viewmodels/chat_view_model.dart';
import 'package:aust_track/theme/app_colors.dart';
import 'package:aust_track/views/widgets/async_views.dart';

/// Buyer ↔ seller chat for a book listing.
///
/// Messages are persisted server-side and scoped to the two participants — the
/// API rejects any third party holding the conversation id. This replaces a
/// local mock whose two sample messages were the same for every seller and
/// vanished on pop.
///
/// Pass [listingId] to open (or reuse) the thread for that listing; the server
/// keys conversations on (listing, buyer) so reopening never forks a new one.
class InAppChatPage extends StatelessWidget {
  final String sellerId;
  final String sellerName;
  final String sellerSubtitle; // e.g. "Online • Biology Dept"
  final String? sellerAvatarUrl;

  /// The listing this conversation is about. Required to start a new thread.
  final String? listingId;

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
    this.listingId,
    this.bookTitle,
    this.bookSubtitle,
    this.bookImageUrl,
  });

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => ChatViewModel(
        context.read<CommunityRepository>(),
        listingId: listingId,
      ),
      child: _ChatBody(
        sellerName: sellerName,
        sellerSubtitle: sellerSubtitle,
        sellerAvatarUrl: sellerAvatarUrl,
        bookTitle: bookTitle,
        bookSubtitle: bookSubtitle,
        bookImageUrl: bookImageUrl,
      ),
    );
  }
}

class _ChatBody extends StatefulWidget {
  final String sellerName;
  final String sellerSubtitle;
  final String? sellerAvatarUrl;
  final String? bookTitle;
  final String? bookSubtitle;
  final String? bookImageUrl;

  const _ChatBody({
    required this.sellerName,
    required this.sellerSubtitle,
    this.sellerAvatarUrl,
    this.bookTitle,
    this.bookSubtitle,
    this.bookImageUrl,
  });

  @override
  State<_ChatBody> createState() => _InAppChatPageState();
}

class _InAppChatPageState extends State<_ChatBody> {
  // Text-field and scroll plumbing are the view's own; the conversation
  // itself belongs to the view model.
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();

  static const _quickReplies = <String>[
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

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
    });
  }

  Future<void> _send(ChatViewModel viewModel) async {
    final messenger = ScaffoldMessenger.of(context);
    final text = _messageController.text;
    _messageController.clear();
    _scrollToBottom();

    final failure = await viewModel.send(text);
    if (failure != null) {
      messenger.showSnackBar(
        SnackBar(content: Text(failure), behavior: SnackBarBehavior.floating),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<ChatViewModel>();
    final hasBook = widget.bookTitle != null;

    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      body: SafeArea(
        child: Column(
          children: [
            _buildAppBar(context),
            if (hasBook) _buildBookBanner(),
            Expanded(
              child: viewModel.isBusy
                  ? const LoadingView()
                  : viewModel.hasError
                  ? ErrorView(
                      message: viewModel.errorMessage!,
                      onRetry: viewModel.open,
                    )
                  : viewModel.isEmpty
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
                itemCount: viewModel.messages.length,
                itemBuilder: (context, index) {
                  return _buildMessageBubble(viewModel.messages[index]);
                },
              ),
            ),
            _buildQuickReplies(),
            _buildInputBar(viewModel),
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

  Widget _buildMessageBubble(ChatMessage message) {
    final isMe = message.isMine;
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
              message.body,
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
              message.displayTime,
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

  Widget _buildInputBar(ChatViewModel viewModel) {
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
                onPressed: viewModel.canSend ? () => _send(viewModel) : null,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
