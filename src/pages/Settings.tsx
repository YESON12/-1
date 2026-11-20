import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { deleteVersion, importBdb } from '../db/importBdb';
import { exportBackup, importBackup } from '../db/backup';
import { DEFAULT_SETTINGS, useSettings, type Settings as S } from '../settings';
import { useVersions } from '../hooks/useVersions';
import { TopBar, useToast } from '../components/ui';

const COLOR_ITEMS: [keyof S['colors'], string, string][] = [
  ['bg', '배경색', '#faf8f4'],
  ['text', '말씀 글자색', '#2b2723'],
  ['verseNum', '장절 번호색', '#8a3b2e'],
  ['memo', '메모 글자색', '#3d6b8f'],
];

export default function Settings() {
  const { settings, update } = useSettings();
  const { versions, primary } = useVersions();
  const toast = useToast();
  const location = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const backupRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ name: string; ratio: number } | null>(null);

  useEffect(() => {
    if (location.hash === '#import') document.getElementById('import')?.scrollIntoView();
  }, [location.hash]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      setProgress({ name: file.name, ratio: 0 });
      try {
        const v = await importBdb(file, (ratio) => setProgress({ name: file.name, ratio }));
        toast(`${v.name} ${v.verseCount.toLocaleString()}절을 가져왔습니다`);
        if (!settings.primaryVersion) update({ primaryVersion: v.code });
      } catch (e) {
        toast(`${file.name}: ${(e as Error).message || '가져오지 못했습니다'}`);
      }
    }
    setProgress(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <TopBar title="설정" />
      <div className="page settings">
        <section className="card" id="import">
          <h2>성경 파일</h2>
          <p className="hint">
            베들레헴 성경 데이터 <code>.bdb</code> 파일을 선택하세요. 한 번 가져오면 이 기기에 저장되어 다시 가져올
            필요가 없습니다. 여러 역본을 한꺼번에 선택해도 됩니다.
          </p>
          {/* accept를 지정하면 일부 안드로이드 파일 선택기에서 .bdb가 회색으로 막혀서 비워 둠 */}
          <input ref={fileRef} type="file" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          <button className="btn primary block" disabled={!!progress} onClick={() => fileRef.current?.click()}>
            {progress ? `가져오는 중… ${Math.round(progress.ratio * 100)}%` : '성경 파일 가져오기'}
          </button>
          {progress && (
            <div className="progress">
              <div style={{ width: `${progress.ratio * 100}%` }} />
            </div>
          )}
          <ul className="version-list">
            {versions?.map((v) => (
              <li key={v.code}>
                <label>
                  <input
                    type="radio"
                    name="primary"
                    checked={primary === v.code}
                    onChange={() => update({ primaryVersion: v.code })}
                  />
                  <b>{v.name}</b>
                  <span className="muted small">{v.verseCount.toLocaleString()}절</span>
                </label>
                <button
                  className="link-btn danger"
                  onClick={async () => {
                    if (confirm(`${v.name} 역본을 이 기기에서 지울까요? (형광펜·메모는 남습니다)`)) {
                      await deleteVersion(v.code);
                      toast('삭제했습니다');
                    }
                  }}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>화면</h2>
          <div className="field">
            <span>테마</span>
            <div className="seg">
              {(
                [
                  ['auto', '시스템'],
                  ['light', '밝게'],
                  ['dark', '어둡게'],
                ] as const
              ).map(([v, l]) => (
                <button key={v} className={settings.theme === v ? 'active' : ''} onClick={() => update({ theme: v })}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span>글꼴</span>
            <div className="seg">
              <button className={settings.fontFamily === 'serif' ? 'active' : ''} onClick={() => update({ fontFamily: 'serif' })}>
                명조
              </button>
              <button className={settings.fontFamily === 'sans' ? 'active' : ''} onClick={() => update({ fontFamily: 'sans' })}>
                고딕
              </button>
            </div>
          </div>
          <label className="field">
            <span>글씨 크기 {settings.fontSize}</span>
            <input type="range" min={12} max={40} value={settings.fontSize} onChange={(e) => update({ fontSize: Number(e.target.value) })} />
          </label>
          <label className="field">
            <span>줄 간격 {settings.lineHeight.toFixed(2)}</span>
            <input
              type="range"
              min={1.3}
              max={2.4}
              step={0.05}
              value={settings.lineHeight}
              onChange={(e) => update({ lineHeight: Number(e.target.value) })}
            />
          </label>
          <p className={`preview font-${settings.fontFamily}`} style={{ fontSize: settings.fontSize, lineHeight: settings.lineHeight }}>
            <span className="vnum-inline">1</span> 태초에 하나님이 천지를 창조하시니라
          </p>
        </section>

        <section className="card">
          <h2>성경읽기 색상</h2>
          {COLOR_ITEMS.map(([k, label, fallback]) => (
            <label key={k} className="field color-field">
              <span>{label}</span>
              <input
                type="color"
                value={settings.colors[k] ?? fallback}
                onChange={(e) => update({ colors: { ...settings.colors, [k]: e.target.value } })}
              />
              {settings.colors[k] && (
                <button className="link-btn" onClick={() => update({ colors: { ...settings.colors, [k]: null } })}>
                  기본값
                </button>
              )}
            </label>
          ))}
          <button className="btn block" onClick={() => update({ colors: DEFAULT_SETTINGS.colors })}>
            색상 모두 초기화
          </button>
        </section>

        <section className="card">
          <h2>성경 듣기</h2>
          <label className="field">
            <span>읽기 속도 {settings.ttsRate.toFixed(1)}배</span>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={settings.ttsRate}
              onChange={(e) => update({ ttsRate: Number(e.target.value) })}
            />
          </label>
          <p className="hint">휴대폰의 음성합성(TTS) 기능을 사용합니다. 한국어 음성이 없으면 기기 설정에서 설치해 주세요.</p>
        </section>

        <section className="card">
          <h2>백업</h2>
          <p className="hint">북마크·형광펜·메모·읽은 기록·기도수첩·설정을 파일로 저장하거나, 새 기기로 옮길 수 있습니다.</p>
          <div className="btn-row">
            <button className="btn" onClick={() => exportBackup()}>
              백업 파일 저장
            </button>
            <button className="btn" onClick={() => backupRef.current?.click()}>
              백업 불러오기
            </button>
          </div>
          <input
            ref={backupRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const n = await importBackup(f);
                toast(`${n}개 항목을 불러왔습니다. 설정은 새로고침 후 적용됩니다.`);
              } catch (err) {
                toast((err as Error).message);
              }
              e.target.value = '';
            }}
          />
        </section>

        <p className="muted small center">My Lovely Bible v3.0 · 원작 M.L.B v2.6.7 (2011)을 최신 기기용으로 다시 만들었습니다.</p>
      </div>
    </>
  );
}
