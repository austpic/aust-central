// Mirrors the static chat data in lib/screens/book_exchange/in_app_chat_page.dart
import type { ChatMessage } from '../models/chatMessage';

export const SEED_CHAT_MESSAGES: ChatMessage[] = [
  {
    text:
      'Hello Professor! Is the Botany textbook still available for swap? I have the Chemistry textbook you requested.',
    sender: 'me',
    time: '9:42 AM',
  },
  {
    text:
      "Yes, it is still available. The Chemistry structure book is exactly what I need for next semester's class!",
    sender: 'them',
    time: '9:44 AM',
  },
];

export const QUICK_REPLIES = ['Still available?', 'Meet at library?', 'Take a swap?'];
