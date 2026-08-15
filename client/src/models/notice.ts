// Mirrors lib/widgets/notice_card.dart (NoticeCategory enum + Notice value type)
export type NoticeCategoryName = 'academic' | 'exam' | 'event' | 'general';

export interface NoticeCategory {
  name: NoticeCategoryName;
  label: string;
}

export const NOTICE_CATEGORIES: NoticeCategory[] = [
  { name: 'academic', label: 'Academic' },
  { name: 'exam', label: 'Exam' },
  { name: 'event', label: 'Event' },
  { name: 'general', label: 'General' },
];

export function categoryFromName(raw?: string): NoticeCategoryName {
  switch (raw) {
    case 'academic':
    case 'exam':
    case 'event':
      return raw;
    default:
      return 'general';
  }
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  postedAt: Date;
  category: NoticeCategoryName;
  pinned: boolean;
}
