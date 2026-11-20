/**
 * 새찬송가(new_song.txt) · 교독문(교독문.txt) 텍스트 파일 해석.
 *
 * 공통: 빈 줄 다음의 "번호. 제목" 줄이 한 항목의 시작입니다. (EUC-KR / UTF-8)
 * 찬송가: "(1)" 로 시작하는 줄이 절의 시작, "후렴:" 은 후렴.
 * 교독문: "-" 인도자, "=" 회중, "(다같이)" 다 함께.
 */

export type SongKind = 'hymn' | 'reading';
export type Role = 'leader' | 'people' | 'all';

export interface SongLine {
  text: string;
  role?: Role;
}

export interface SongBlock {
  /** "1", "2" … 절 번호, "후렴", 또는 없음 */
  label?: string;
  lines: SongLine[];
}

export interface Song {
  kind: SongKind;
  no: number;
  title: string;
  blocks: SongBlock[];
}

export const KIND_LABEL: Record<SongKind, string> = { hymn: '새찬송가', reading: '교독문' };

const HEADER = /^(\d{1,3})\.\s*(.*)$/;

export function decodeText(bytes: Uint8Array): string {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    text = new TextDecoder('euc-kr').decode(bytes);
  }
  return text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
}

/** 본문 줄의 30% 이상이 "-" / "=" 로 시작하면 교독문 */
export function detectKind(text: string): SongKind {
  const lines = text.split('\n').filter((l) => l.trim() && !HEADER.test(l.trim()));
  const marked = lines.filter((l) => /^\s*[-=]/.test(l)).length;
  return lines.length && marked / lines.length >= 0.3 ? 'reading' : 'hymn';
}

function splitEntries(text: string) {
  const out: { no: number; title: string; body: string[] }[] = [];
  let prevBlank = true;
  for (const raw of text.split('\n')) {
    const line = raw.trimEnd();
    const m = prevBlank ? line.trim().match(HEADER) : null;
    if (m) out.push({ no: Number(m[1]), title: m[2].trim(), body: [] });
    else if (out.length) out[out.length - 1].body.push(line);
    prevBlank = line.trim() === '';
  }
  return out;
}

function hymnBlocks(body: string[]): SongBlock[] {
  const blocks: SongBlock[] = [];
  let cur: SongBlock | null = null;
  const start = (label?: string) => {
    cur = { label, lines: [] };
    blocks.push(cur);
    return cur;
  };
  for (const raw of body) {
    const line = raw.trim();
    if (!line) {
      cur = null;
      continue;
    }
    const verse = line.match(/^\((\d+)\)\s*(.*)$/);
    const chorus = line.match(/^후렴\s*[:：]\s*(.*)$/);
    if (verse) start(verse[1]).lines.push({ text: verse[2] });
    else if (chorus) {
      start('후렴').lines.push({ text: chorus[1] });
      cur = null; // 후렴 다음 줄은 새 단락
    } else (cur ?? start()).lines.push({ text: line });
  }
  return blocks.filter((b) => b.lines.some((l) => l.text));
}

function readingBlocks(body: string[]): SongBlock[] {
  const lines: SongLine[] = [];
  for (const raw of body) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('-')) lines.push({ role: 'leader', text: line.slice(1).trim() });
    else if (line.startsWith('=')) lines.push({ role: 'people', text: line.slice(1).trim() });
    else lines.push({ role: 'all', text: line.replace(/^\(\s*다\s*같이\s*\)\s*/, '') });
  }
  return [{ lines }];
}

export function parseSongbook(text: string, kind: SongKind = detectKind(text)): Song[] {
  const seen = new Set<number>();
  const songs: Song[] = [];
  for (const e of splitEntries(text)) {
    if (seen.has(e.no)) continue; // 같은 번호가 두 번 나오면 앞의 것만
    seen.add(e.no);
    const blocks = kind === 'hymn' ? hymnBlocks(e.body) : readingBlocks(e.body);
    if (blocks.length) songs.push({ kind, no: e.no, title: e.title.replace(/\s+/g, ' '), blocks });
  }
  return songs.sort((a, b) => a.no - b.no);
}
