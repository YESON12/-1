import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { db, type Verse, type Version } from './db';

const utf8 = new TextDecoder('utf-8', { fatal: true });
const eucKr = new TextDecoder('euc-kr');

/** 본문이 UTF-8이 아니면(옛 데이터) EUC-KR로 읽습니다. */
function decode(bytes: Uint8Array): string {
  try {
    return utf8.decode(bytes);
  } catch {
    return eucKr.decode(bytes);
  }
}

const CHUNK = 2000;

/**
 * 베들레헴 성경 .bdb (SQLite, 테이블 Bible(book, chapter, verse, btext)) 를 읽어 IndexedDB에 저장합니다.
 * 같은 이름의 역본이 이미 있으면 교체합니다.
 */
export async function importBdb(file: File, onProgress: (ratio: number) => void): Promise<Version> {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const sqlite = new SQL.Database(new Uint8Array(await file.arrayBuffer()));
  let verses: Verse[];
  const name = file.name.replace(/\.[^.]+$/, '').trim() || '성경';
  try {
    const table = sqlite.exec("select name from sqlite_master where type='table' and lower(name)='bible'");
    if (!table.length) throw new Error('성경 데이터(Bible 테이블)가 없는 파일입니다.');
    const tableName = String(table[0].values[0][0]);
    const stmt = sqlite.prepare(
      `select book, chapter, verse, cast(btext as blob) from "${tableName}" order by book, chapter, verse`,
    );
    verses = [];
    while (stmt.step()) {
      const [book, chapter, verse, raw] = stmt.get() as [number, number, number, Uint8Array | null];
      if (!(book >= 1 && book <= 66) || !raw) continue;
      verses.push({ version: name, book, chapter, verse, text: decode(raw).trim() });
    }
    stmt.free();
  } finally {
    sqlite.close();
  }
  if (verses.length === 0) throw new Error('읽을 수 있는 구절이 없습니다.');

  await db.verses.where('version').equals(name).delete();
  for (let i = 0; i < verses.length; i += CHUNK) {
    await db.verses.bulkPut(verses.slice(i, i + CHUNK));
    onProgress(Math.min(1, (i + CHUNK) / verses.length));
  }
  const version: Version = { code: name, name, verseCount: verses.length, importedAt: Date.now() };
  await db.versions.put(version);
  navigator.storage?.persist?.().catch(() => {});
  return version;
}

export async function deleteVersion(code: string) {
  await db.transaction('rw', db.verses, db.versions, async () => {
    await db.verses.where('version').equals(code).delete();
    await db.versions.delete(code);
  });
}
