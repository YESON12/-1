import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { decodeText, KIND_LABEL, parseSongbook, type Song, type SongKind } from '../data/songbook';

/**
 * new_song.txt(새찬송가) / 교독문.txt 를 읽어 IndexedDB에 저장합니다.
 * 어느 쪽인지는 내용으로 판단하고, 같은 종류가 이미 있으면 교체합니다.
 */
export async function importSongFile(file: File): Promise<{ kind: SongKind; count: number }> {
  const text = decodeText(new Uint8Array(await file.arrayBuffer()));
  const songs = parseSongbook(text);
  if (songs.length < 5) throw new Error('찬송가·교독문 형식("1. 제목")이 아닌 파일입니다.');
  const kind = songs[0].kind;
  await db.transaction('rw', db.songs, async () => {
    await db.songs.where('kind').equals(kind).delete();
    await db.songs.bulkPut(songs);
  });
  navigator.storage?.persist?.().catch(() => {});
  return { kind, count: songs.length };
}

export const deleteSongs = (kind: SongKind) => db.songs.where('kind').equals(kind).delete();

export const songCount = (kind: SongKind) => db.songs.where('kind').equals(kind).count();

/** 목록 (가사 없이 번호·제목만) — undefined 는 불러오는 중 */
export function useSongList(kind: SongKind) {
  return useLiveQuery(async () => {
    const all = await db.songs.where('kind').equals(kind).toArray();
    return all.map((s) => ({ no: s.no, title: s.title })).sort((a, b) => a.no - b.no);
  }, [kind]);
}

export function useSong(kind: SongKind, no: number) {
  return useLiveQuery(async () => (await db.songs.get([kind, no])) ?? null, [kind, no]) as Song | null | undefined;
}

export { KIND_LABEL };
