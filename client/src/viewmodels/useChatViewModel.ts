import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SEED_BOOKS } from '../data/books';
import { SEED_CHAT_MESSAGES, QUICK_REPLIES } from '../data/chatMessages';
import type { ChatMessage } from '../models/chatMessage';

// Mirrors _InAppChatPageState in lib/screens/book_exchange/in_app_chat_page.dart
export function useChatViewModel() {
  const navigate = useNavigate();
  const { id } = useParams();
  const book = SEED_BOOKS.find((b) => b.id === id);
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_CHAT_MESSAGES);
  const [draft, setDraft] = useState('');

  const sellerName = book?.seller ?? 'Book Seller';
  const sellerId = book?.sellerId ?? 'seller_001';

  function send() {
    const text = draft.trim();
    if (text === '') return;
    setMessages((prev) => [...prev, { text, sender: 'me', time: 'Now' }]);
    setDraft('');
  }

  return {
    sellerName,
    sellerId,
    subtitle: 'Offline',
    book,
    messages,
    quickReplies: QUICK_REPLIES,
    draft,
    setDraft,
    send,
    goBack: () => navigate(-1),
  };
}
