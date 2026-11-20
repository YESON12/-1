import { db } from './db';
import { loadSettings, saveSettings } from '../settings';
import { isNative, nativeSaveFile } from '../native';

const TABLES = ['bookmarks', 'highlights', 'memos', 'history', 'readRecords', 'prayers'] as const;

/** 성경 본문을 뺀 사용자 데이터(북마크·형광펜·메모·기록·기도수첩·설정)를 JSON 파일로 내려받습니다. */
export async function exportBackup() {
  const data: Record<string, unknown> = { app: 'my-lovely-bible', version: 1, exportedAt: new Date().toISOString() };
  for (const t of TABLES) data[t] = await db.table(t).toArray();
  data.settings = loadSettings();
  const json = JSON.stringify(data, null, 1);
  const fileName = `mlb-backup-${new Date().toISOString().slice(0, 10)}.json`;
  if (isNative) {
    await nativeSaveFile(fileName, json);
    return;
  }
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/** 백업 파일을 현재 데이터에 합칩니다(같은 항목은 백업 내용으로 덮어씀). */
export async function importBackup(file: File): Promise<number> {
  const data = JSON.parse(await file.text());
  if (data?.app !== 'my-lovely-bible') throw new Error('My Lovely Bible 백업 파일이 아닙니다.');
  let count = 0;
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const t of TABLES) {
      const rows = Array.isArray(data[t]) ? data[t] : [];
      await db.table(t).bulkPut(rows);
      count += rows.length;
    }
  });
  if (data.settings) saveSettings({ ...loadSettings(), ...data.settings });
  return count;
}
