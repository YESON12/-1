import { NAMES } from '../theme';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { bookById, formatRef } from '../data/books';
import { db, getVerseText, HIGHLIGHT_COLORS, HIGHLIGHT_LABELS, type HighlightColor } from '../db/db';
import { useVersions } from '../hooks/useVersions';
import { Empty, Sheet, Tabs, TopBar, useToast, VerseText } from '../components/ui';

type Tab = 'bookmarks' | 'highlights' | 'memos' | 'history';

interface Row {
  id: string | number;
  book: number;
  chapter: number;
  verse?: number;
  sub?: string;
  badge?: string;
  color?: HighlightColor;
}

/** 각 항목에 기본 역본의 구절 본문을 붙여 줍니다. */
function useTexts(rows: Row[] | undefined, version: string | undefined) {
  return useLiveQuery(
    async () => {
      const out = new Map<Row['id'], string>();
      for (const r of rows ?? []) if (r.verse) out.set(r.id, await getVerseText(version, r.book, r.chapter, r.verse));
      return out;
    },
    [rows, version],
  );
}

export default function Lists() {
  const [sp, setSp] = useSearchParams();
  const tab = (sp.get('tab') as Tab) || 'bookmarks';
  const setTab = (t: Tab) => setSp({ tab: t }, { replace: true });
  const { primary } = useVersions();
  const toast = useToast();
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [colorFilter, setColorFilter] = useState<HighlightColor | null>(null);
  const [editing, setEditing] = useState<{ id: number; tag: string } | null>(null);

  const bookmarks = useLiveQuery(() => db.bookmarks.orderBy('createdAt').reverse().toArray(), []);
  const highlights = useLiveQuery(() => db.highlights.orderBy('createdAt').reverse().toArray(), []);
  const memos = useLiveQuery(() => db.memos.orderBy('updatedAt').reverse().toArray(), []);
  const history = useLiveQuery(() => db.history.orderBy('at').reverse().limit(200).toArray(), []);

  const tags = [...new Set(bookmarks?.map((b) => b.tag).filter(Boolean))];

  let rows: Row[] | undefined;
  if (tab === 'bookmarks')
    rows = bookmarks
      ?.filter((b) => !tagFilter || b.tag === tagFilter)
      .map((b) => ({ id: b.id!, book: b.book, chapter: b.chapter, verse: b.verse, badge: b.tag }));
  else if (tab === 'highlights')
    rows = highlights
      ?.filter((h) => !colorFilter || h.color === colorFilter)
      .map((h) => ({ id: h.key, book: h.book, chapter: h.chapter, verse: h.verse, color: h.color }));
  else if (tab === 'memos')
    rows = memos?.map((m) => ({ id: m.key, book: m.book, chapter: m.chapter, verse: m.verse, sub: m.text }));
  else
    rows = history?.map((h) => ({
      id: h.key,
      book: h.book,
      chapter: h.chapter,
      sub: new Date(h.at).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }),
    }));

  const texts = useTexts(tab === 'history' ? undefined : rows, primary);

  const remove = async (r: Row) => {
    if (tab === 'bookmarks') await db.bookmarks.delete(r.id as number);
    if (tab === 'highlights') await db.highlights.delete(r.id as string);
    if (tab === 'memos') await db.memos.delete(r.id as string);
    if (tab === 'history') await db.history.delete(r.id as string);
    toast('삭제했습니다');
  };

  return (
    <>
      <TopBar
        title={NAMES.lists}
        right={
          tab === 'history' && !!history?.length ? (
            <button
              className="chip-btn"
              onClick={async () => {
                if (confirm('읽기 기록을 모두 지울까요?')) await db.history.clear();
              }}
            >
              모두 지우기
            </button>
          ) : undefined
        }
      />
      <div className="page">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            ['bookmarks', '북마크'],
            ['highlights', '형광펜'],
            ['memos', '메모'],
            ['history', '읽기기록'],
          ]}
        />

        {tab === 'bookmarks' && tags.length > 0 && (
          <div className="chips">
            <button className={!tagFilter ? 'chip active' : 'chip'} onClick={() => setTagFilter(null)}>
              전체
            </button>
            {tags.map((t) => (
              <button key={t} className={tagFilter === t ? 'chip active' : 'chip'} onClick={() => setTagFilter(t)}>
                {t}
              </button>
            ))}
          </div>
        )}
        {tab === 'highlights' && (
          <div className="color-row small">
            <button className={!colorFilter ? 'chip active' : 'chip'} onClick={() => setColorFilter(null)}>
              전체
            </button>
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c}
                aria-label={HIGHLIGHT_LABELS[c]}
                className={`swatch hl-${c}${colorFilter === c ? ' active' : ''}`}
                onClick={() => setColorFilter(c)}
              />
            ))}
          </div>
        )}

        {rows && rows.length === 0 && (
          <Empty>
            {
              {
                bookmarks: '저장된 북마크가 없습니다. 본문에서 구절을 눌러 북마크해 보세요.',
                highlights: '형광펜 표시된 절이 없습니다.',
                memos: '메모한 구절이 없습니다.',
                history: '읽기 기록이 없습니다.',
              }[tab]
            }
          </Empty>
        )}

        <ul className="item-list">
          {rows?.map((r) => (
            <li key={r.id} className={r.color ? `hl-${r.color}` : undefined}>
              <Link to={`/read/${r.book}/${r.chapter}${r.verse ? `?v=${r.verse}` : ''}`} className="item-main">
                <span className="ref">
                  {r.verse ? formatRef(r.book, r.chapter, [r.verse]) : `${bookById(r.book).name} ${r.chapter}장`}
                  {r.badge && <span className="tag">{r.badge}</span>}
                </span>
                {texts?.get(r.id) && (
                  <span className="snippet">
                    <VerseText text={texts.get(r.id)!} />
                  </span>
                )}
                {r.sub && <span className={tab === 'memos' ? 'memo' : 'muted small'}>{tab === 'memos' ? `¶ ${r.sub}` : r.sub}</span>}
              </Link>
              <div className="item-actions">
                {tab === 'bookmarks' && (
                  <button className="link-btn" onClick={() => setEditing({ id: r.id as number, tag: r.badge ?? '' })}>
                    태그
                  </button>
                )}
                <button className="link-btn danger" onClick={() => remove(r)}>
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title="북마크 태그">
        {editing && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await db.bookmarks.update(editing.id, { tag: editing.tag.trim() });
              setEditing(null);
            }}
          >
            <input
              className="input"
              autoFocus
              value={editing.tag}
              placeholder="주일설교, 암송구절, 심방…"
              onChange={(e) => setEditing({ ...editing, tag: e.target.value })}
            />
            <button className="btn primary block">저장</button>
          </form>
        )}
      </Sheet>
    </>
  );
}
