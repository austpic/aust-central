// Mirrors the chat message value type in lib/screens/book_exchange/in_app_chat_page.dart
export interface ChatMessage {
  text: string;
  sender: 'me' | 'them';
  time: string;
}
