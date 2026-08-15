// Mirrors the notifications list in lib/screens/book_exchange/book_notification_page.dart
export interface AppNotification {
  title: string;
  body: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

export function toAppNotification(row: Json): AppNotification {
  return { title: row.title as string, body: row.body as string };
}
