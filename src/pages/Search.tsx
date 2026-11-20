import { NAMES } from '../theme';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BOOKS, bookById } from '../data/books';
import { db, type Verse } from '../db/db';
import { useVersions } from '../hooks/useVersions';
import { Empty, TopBar, VerseText } from '../components/ui';

type Scope = 'all' | 'old' | 'new' | 'range';

interface State {
  terms: string[];
  scope: Scope;
  from: number;
  to: number;
  version: string;
  results: Verse[] | null;
}

// 뒤로가기로 돌아와도 검색 결과가 남아 있도록 모듈 변수에 보관
let saved: State = { terms: ['', '', ''], scope: 'all', from: 1, to: 66, version: '', results: null };
const cache = new Map<string, Verse[]>();
const SHOW = 300;

async function loadAll(version: string) {
  if (!cache.has(version)) cache.set(version, await db.verses.where('version').equals(version).toArray());
  return cache.get(version)!;
}

export default function Search() {
  const { versions, primary } = useVersions();
  const [s, setS] = useState<State>(saved);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<State>) =>
    setS((prev) => {
      saved = { ...prev, ...patch };
      return saved;
    });
  const version = s.version || primary || '';

  // 화면이 열리면 미리 본문을 메모리에 올려 첫 검색도 빠르게
  useEffect(() => {
    if (version) loadAll(version);
  }, [version]);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    const terms = s.terms.map((t) => t.trim()).filter(Boolean);
    if (!terms.length || !version) return;
    setBusy(true);
    const all = await loadAll(version);
    const [lo, hi] =
      s.scope === 'old' ? [1, 39] : s.scope === 'new' ? [40, 66] : s.scope === 'range' ? [Math.min(s.from, s.to), Math.max(s.from, s.to)] : [1, 66];
    const results = all.filter((v) => v.book >= lo && v.book <= hi && terms.every((t) => v.text.includes(t)));
    set({ results });
    setBusy(false);
  };

  const terms = s.terms.map((t) => t.trim()).filter(Boolean);

  return (
    <>
      <TopBar title={NAMES.search} />
      <div className="page">
        <form className="search-form" onSubmit={run}>
          {s.terms.map((t, i) => (
            <input
              key={i}
              className="input"
              value={t}
              placeholder={i === 0 ? '검색어 (예: 사랑)' : `함께 들어갈 단어 ${i + 1} (선택)`}
              onChange={(e) => set({ terms: s.terms.map((x, j) => (j === i ? e.target.value : x)) })}
              enterKeyHint="search"
            />
          ))}
          <div className="radio-row">
            {(
              [
                ['all', '전체'],
                ['old', '구약'],
                ['new', '신약'],
                ['range', '범위 지정'],
              ] as [Scope, string][]
            ).map(([v, label]) => (
              <label key={v} className={s.scope === v ? 'chip active' : 'chip'}>
                <input type="radio" name="scope" checked={s.scope === v} onChange={() => set({ scope: v })} />
                {label}
              </label>
            ))}
          </div>
          {s.scope === 'range' && (
            <div className="range-row">
              <select className="input" value={s.from} onChange={(e) => set({ from: Number(e.target.value) })}>
                {BOOKS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              ~
              <select className="input" value={s.to} onChange={(e) => set({ to: Number(e.target.value) })}>
                {BOOKS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {versions && versions.length > 1 && (
            <select className="input" value={version} onChange={(e) => set({ version: e.target.value })}>
              {versions.map((v) => (
                <option key={v.code} value={v.code}>
                  {v.name}
                </option>
              ))}
            </select>
          )}
          <button className="btn primary block" disabled={busy || !version}>
            {busy ? '검색 중…' : '검색'}
          </button>
        </form>

        {s.results && (
          <>
            <p className="result-count">
              <b>{s.results.length.toLocaleString()}</b>개 구절
              {s.results.length > SHOW && ` (처음 ${SHOW}개 표시)`}
            </p>
            {s.results.length === 0 && <Empty>찾는 단어가 들어간 구절이 없습니다.</Empty>}
            <ul className="result-list">
              {s.results.slice(0, SHOW).map((v) => (
                <li key={`${v.book}:${v.chapter}:${v.verse}`}>
                  <Link to={`/read/${v.book}/${v.chapter}?v=${v.verse}`}>
                    <span className="ref">
                      {bookById(v.book).abbr} {v.chapter}:{v.verse}
                    </span>
                    <span className="snippet">
                      <VerseText text={v.text} highlight={terms} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
