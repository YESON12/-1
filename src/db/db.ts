import Dexie, { type EntityTable, type Table } from 'dexie';

export interface Version {
  code: string;
  name: string;
  verseCount: number;
  importedAt: number;
}

export interface Verse {
  version: string;
  book: number;
  chapter: number;
  verse: number;
  text: string;
}

/** 절 위치 키 "책:장:절" — 역본과 상관없이 형광펜·메모·북마크가 같이 보이도록 */
interface VerseRef {
  key: string;
  book: number;
  chapter: number;
  verse: number;
}

export interface Bookmark extends VerseRef {
  id?: number;
  tag: string;
  createdAt: number;
}

export interface Highlight extends VerseRef {
  color: HighlightColor;
  createdAt: number;
}

export interface Memo extends VerseRef {
  text: string;
  updatedAt: number;
}

export interface HistoryItem {
  key: string;
  book: number;
  chapter: number;
  at: number;
}

export interface ReadRecord {
  key: string;
  book: number;
  chapter: number;
  count: number;
  lastAt: number;
}

export type PrayerStatus = 'praying' | 'answered' | 'changed';

export interface Prayer {
  id?: number;
  title: string;
  content: string;
  tag: string;
  status: PrayerStatus;
  insight: string;
  createdAt: number;
  updatedAt: number;
}

export const HIGHLIGHT_COLORS = ['yellow', 'green', 'blue', 'pink', 'orange'] as const;
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];
export const HIGHLIGHT_LABELS: Record<HighlightColor, string> = {
  yellow: '노랑',
  green: '초록',
  blue: '파랑',
  pink: '분홍',
  orange: '주황',
};

export type { Song } from '../data/songbook';
import type { Song } from '../data/songbook';

export const db = new Dexie('my-lovely-bible') as Dexie & {
  songs: Table<Song, [string, number]>;
  versions: EntityTable<Version, 'code'>;
  verses: Table<Verse, [string, number, number, number]>;
  bookmarks: EntityTable<Bookmark, 'id'>;
  highlights: EntityTable<Highlight, 'key'>;
  memos: EntityTable<Memo, 'key'>;
  history: EntityTable<HistoryItem, 'key'>;
  readRecords: EntityTable<ReadRecord, 'key'>;
  prayers: EntityTable<Prayer, 'id'>;
};

db.version(1).stores({
  versions: 'code',
  verses: '[version+book+chapter+verse], [version+book+chapter], version',
  bookmarks: '++id, key, tag, createdAt',
  highlights: 'key, color, createdAt',
  memos: 'key, updatedAt',
  history: 'key, at',
  readRecords: 'key, book',
  prayers: '++id, status, tag, createdAt',
});

// v2: 새찬송가 · 교독문 (사용자가 가져온 텍스트 파일)
db.version(2).stores({
  songs: '[kind+no], kind',
});

export const verseKey = (book: number, chapter: number, verse: number) => `${book}:${chapter}:${verse}`;
export const chapterKey = (book: number, chapter: number) => `${book}:${chapter}`;

/** 한 장에 속한 키 범위 ("1:1:" ~ "1:1:￿") */
export const chapterRange = (book: number, chapter: number): [string, string] => [
  `${book}:${chapter}:`,
  `${book}:${chapter}:￿`,
];

export async function getVerseText(version: string | undefined, book: number, chapter: number, verse: number) {
  if (!version) return '';
  const v = await db.verses.get([version, book, chapter, verse]);
  return v?.text ?? '';
}
