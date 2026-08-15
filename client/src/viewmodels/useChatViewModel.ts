import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { communityRepository } from '../repositories/community';
import { ApiError } from '../api/errors';
import type { ChatMessage } from '../models/chatMessage';
import { QUICK_REPLIES, toChatMessage } from '../models/chatMessage';

// Mirrors ChatViewModel in lib/viewmodels/chat_view_model.dart. The server
// keys conversations on (listing, buyer), so opening the thread is
// idempotent — reopening never forks a new one. Access is checked
// server-side: a third party holding the conversation id gets a 404.
//
// The route param is the listing id (as Flutter's ChatViewModel takes it);
// the listing itself is fetched here so a page reload keeps the seller name
// and book banner, rather than relying on router state that vanishes on
// refresh.
export function useChatViewModel() {
  const navigate = useNavigate();
  const { id: listingId } = useParams();

  const [book, setBook] = useState<
    { title: string; course: string; tag: string; sellerName: string; sellerId: string } | undefined
  >(undefined);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = useCallback(async () => {
    if (!listingId) {
      setError('Open a chat from a listing to message this seller.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const listing = await communityRepository.listing(listingId);
      const type = listing.listingType as string;
      const price = listing.priceBdt as number | null;
      setBook({
        title: listing.title as string,
        course: listing.courseCode as string,
        tag: type === 'SALE' ? `${price} BDT` : type === 'FREE' ? 'Free' : 'Swap',
        sellerName: (listing.seller as { name: string }).name,
        sellerId: (listing.seller as { id: string }).id,
      });

      const conversation = await communityRepository.startConversation(listingId);
      const cid = conversation.id as string;
      setConversationId(cid);

      const { items: rows } = await communityRepository.messages(cid);
      // The API pages newest-first; a transcript reads oldest-first.
      setMessages(rows.slice().reverse().map(toChatMessage));

      // Clearing the badge is best-effort -- failing it must not break the view.
      communityRepository.markConversationRead(cid).catch(() => {});
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not open this conversation.');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    open();
  }, [open]);

  async function send() {
    const text = draft.trim();
    if (text === '' || !conversationId || sending) return;

    // Optimistic: the bubble appears immediately and is removed if the send
    // fails, so the thread never shows a message that was not delivered.
    const pending: ChatMessage = { text, sender: 'me', time: 'Now' };
    setMessages((prev) => [...prev, pending]);
    setDraft('');
    setSending(true);

    try {
      const sent = await communityRepository.sendMessage(conversationId, text);
      setMessages((prev) => {
        const next = [...prev];
        const index = next.lastIndexOf(pending);
        if (index !== -1) next[index] = toChatMessage(sent);
        return next;
      });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m !== pending));
      setError(err instanceof ApiError ? err.message : 'Could not send the message.');
    } finally {
      setSending(false);
    }
  }

  return {
    sellerName: book?.sellerName ?? 'Book Seller',
    sellerId: book?.sellerId,
    subtitle: 'Offline',
    book,
    messages,
    quickReplies: QUICK_REPLIES,
    draft,
    setDraft,
    send,
    loading,
    sending,
    error,
    goBack: () => navigate(-1),
  };
}
