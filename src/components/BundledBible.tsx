import { useEffect, useState } from 'react';
import { db } from '../db/db';
import { importBdb } from '../db/importBdb';
import { useSettings } from '../settings';

/** 앱(APK) 빌드에 넣은 성경 파일. 웹 빌드에서는 비어 있음. */
const BUNDLED: { file: string; name: string }[] = import.meta.env.VITE_BUNDLED_BIBLES
  ? JSON.parse(import.meta.env.VITE_BUNDLED_BIBLES)
  : [];

/** 처음 실행할 때 내장 성경을 IndexedDB로 옮깁니다(한 번만, 기기에 따라 수 초). */
export default function BundledBible() {
  const { settings, update } = useSettings();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!BUNDLED.length) return;
    let cancelled = false;
    (async () => {
      const have = new Set(await db.versions.toCollection().primaryKeys());
      const todo = BUNDLED.filter((b) => !have.has(b.name));
      if (!todo.length) return;
      setProgress(0);
      try {
        for (const [i, b] of todo.entries()) {
          const blob = await (await fetch(`./bible/${b.file}`)).blob();
          await importBdb(new File([blob], `${b.name}.bdb`), (r) => !cancelled && setProgress((i + r) / todo.length));
        }
        if (!settings.primaryVersion) update({ primaryVersion: todo[0].name });
        if (!cancelled) setProgress(null);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
    // 처음 한 번만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (progress === null && !error) return null;
  return (
    <div className="first-run">
      <h1>My Lovely Bible</h1>
      {error ? (
        <p>성경 데이터를 준비하지 못했습니다: {error}</p>
      ) : (
        <>
          <p>처음 한 번만 성경 데이터를 준비하고 있어요…</p>
          <div className="progress">
            <div style={{ width: `${Math.round((progress ?? 0) * 100)}%` }} />
          </div>
          <p className="muted small">{Math.round((progress ?? 0) * 100)}%</p>
        </>
      )}
    </div>
  );
}
