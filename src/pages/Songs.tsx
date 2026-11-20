import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Role, SongKind } from '../data/songbook';
import { KIND_LABEL, useSong, useSongList } from '../db/importSongs';
import { useSettings } from '../settings';
import { Empty, TopBar } from '../components/ui';

const BASE: Record<SongKind, string> = { hymn: '/hymns', reading: '/readings' };
const UNIT: Record<SongKind, string> = { hymn: '장', reading: '번' };
const ROLE_LABEL: Record<Role, string> = { leader: '인도자', people: '회중', all: '다같이' };

function NoData({ kind }: { kind: SongKind }) {
  return (
    <Empty>
      아직 {KIND_LABEL[kind]} 파일이 없습니다.
      <br />
      설정에서 <code>{kind === 'hymn' ? 'new_song.txt' : '교독문.txt'}</code> 파일을 한 번만 가져오면 됩니다.
      <Link className="btn primary" to="/settings#songs">
        파일 가져오기
      </Link>
    </Empty>
  );
}

/** 새찬송가 / 교독문 목록: 번호로 바로 가기 + 제목 찾기 */
export function SongList({ kind }: { kind: SongKind }) {
  const list = useSongList(kind);
  const nav = useNavigate();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const t = q.trim();
    if (!list || !t) return list;
    if (/^\d+$/.test(t)) return list.filter((s) => String(s.no).startsWith(t));
    const words = t.split(/\s+/);
    return list.filter((s) => words.every((w) => s.title.includes(w)));
  }, [list, q]);

  const go = () => {
    const n = Number(q.trim());
    if (n && list?.some((s) => s.no === n)) nav(`${BASE[kind]}/${n}`);
  };

  return (
    <>
      <TopBar title={KIND_LABEL[kind]} />
      {list && list.length === 0 ? (
        <NoData kind={kind} />
      ) : (
        <div className="page">
          <form
            className="search-row"
            onSubmit={(e) => {
              e.preventDefault();
              go();
            }}
          >
            <input
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={kind === 'hymn' ? '장 번호 또는 제목 (예: 305)' : '번호 또는 제목 (예: 시편)'}
              aria-label="번호 또는 제목"
              enterKeyHint="go"
            />
            <button className="btn primary" type="submit" disabled={!/^\d+$/.test(q.trim())}>
              이동
            </button>
          </form>
          {filtered && (
            <ul className="song-list">
              {filtered.map((s) => (
                <li key={s.no}>
                  <Link to={`${BASE[kind]}/${s.no}`}>
                    <span className="song-no">{s.no}</span>
                    <span className="song-title">{s.title}</span>
                  </Link>
                </li>
              ))}
              {filtered.length === 0 && <li className="muted center song-none">찾는 {KIND_LABEL[kind]}이 없습니다</li>}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

/** 가사 / 교독문 본문 */
export function SongView({ kind }: { kind: SongKind }) {
  const no = Number(useParams().no);
  const song = useSong(kind, no);
  const list = useSongList(kind);
  const { settings } = useSettings();

  const idx = list?.findIndex((s) => s.no === no) ?? -1;
  const prev = idx > 0 ? list![idx - 1] : null;
  const next = list && idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

  return (
    <div className={`song-view font-${settings.fontFamily}`}>
      <TopBar title={`${KIND_LABEL[kind]} ${no}${UNIT[kind]}`} />
      {song === null ? (
        list && list.length === 0 ? (
          <NoData kind={kind} />
        ) : (
          <Empty>{no}{UNIT[kind]}은 파일에 없습니다.</Empty>
        )
      ) : (
        song && (
          <article className="page song" style={{ fontSize: settings.fontSize, lineHeight: settings.lineHeight }}>
            <h2 className="song-head">
              <span className="song-head-no">
                {no}
                {UNIT[kind]}
              </span>
              {song.title}
            </h2>

            {kind === 'hymn'
              ? song.blocks.map((b, i) => (
                  <section key={i} className={b.label === '후렴' ? 'stanza chorus' : 'stanza'}>
                    {b.label && <span className="stanza-label">{b.label === '후렴' ? '후렴' : `${b.label}절`}</span>}
                    {b.lines.map((l, j) => (
                      <p key={j}>{l.text}</p>
                    ))}
                  </section>
                ))
              : song.blocks[0].lines.map((l, i) => (
                  <p key={i} className={`resp resp-${l.role}`}>
                    <span className="resp-role">{ROLE_LABEL[l.role ?? 'all']}</span>
                    <span className="resp-text">{l.text}</span>
                  </p>
                ))}

            <nav className="chapter-nav song-nav">
              {prev ? (
                <Link className="btn" to={`${BASE[kind]}/${prev.no}`} replace>
                  ‹ {prev.no}
                  {UNIT[kind]}
                </Link>
              ) : (
                <span />
              )}
              <Link className="btn" to={BASE[kind]}>
                목록
              </Link>
              {next ? (
                <Link className="btn" to={`${BASE[kind]}/${next.no}`} replace>
                  {next.no}
                  {UNIT[kind]} ›
                </Link>
              ) : (
                <span />
              )}
            </nav>
          </article>
        )
      )}
    </div>
  );
}
