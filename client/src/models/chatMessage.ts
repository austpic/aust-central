// Mirrors the chat message value type in lib/screens/book_exchange/in_app_chat_page.dart
export interface ChatMessage {
  text: string;
  sender: 'me' | 'them';
  time: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

/** "9:42 AM" from an ISO timestamp; "Now" while a send is still in flight. */
function displayTime(iso?: string): string {
  if (!iso) return 'Now';
  const d = new Date(iso);
  const hour = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
  const minute = d.getMinutes().toString().padStart(2, '0');
  return `${hour}:${minute} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
}

/** Maps a server message (body/isMine/createdAt) onto the display shape. */
export function toChatMessage(row: Json): ChatMessage {
  return {
    text: row.body as string,
    sender: row.isMine ? 'me' : 'them',
    time: displayTime(row.createdAt as string | undefined),
  };
}

// Preset quick-reply chips shown above the composer -- a UI convenience, not
// a stand-in for real conversation data.
export const QUICK_REPLIES = ['Still available?', 'Meet at library?', 'Take a swap?'];
