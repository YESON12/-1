import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { BOOKS, bookById, parseReference } from '../data/books';
import { db } from '../db/db';
import { useSettings } from '../settings';
import { Tabs, TopBar, useToast } from '../components/ui';

export default function BookPicker() {
  const nav = useNavigate();
  const toast = useToast();
  const { settings } = useSettings();
  const lastBook = settings.last ? bookById(settings.last.book) : null;
  const [tab, setTab] = useState<'old' | 'new'>(lastBook?.testament ?? 'old');
  const [book, setBook] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  const records = useLiveQuery(() => (book ? db.readRecords.where('book').equals(book).toArray() : []), [book]);
  const counts = useMemo(() => new Map(records?.map((r) => [r.chapter, r.count])), [records]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      const last = settings.last ?? { book: 1, chapter: 1 };
      nav(`/read/${last.book}/${last.chapter}`);
      return;
    }
    const ref = parseReference(query);
    if (!ref) {
      toast('찾을 수 없습니다. 예) 창1, 요3:16, 롬8');
      return;
    }
    nav(`/read/${ref.book}/${ref.chapter}${ref.verse ? `?v=${ref.verse}` : ''}`);
  };

  const bk = book ? bookById(book) : null;

  return (
    <>
      <TopBar title={bk ? bk.name : '본문 선택'} />
      <div className="page">
        <form className="search-row" onSubmit={submit}>
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예) 요3:16, 롬8 · 비우면 최근 본문"
            enterKeyHint="go"
          />
          <button className="btn primary">이동</button>
        </form>

        {bk ? (
          <>
            <div className="row-between">
              <button className="link-btn" onClick={() => setBook(null)}>
                ‹ 책 목록
              </button>
              <span className="legend">
                읽은 횟수 <i className="rc-1" />1 <i className="rc-2" />2 <i className="rc-3" />3+
              </span>
            </div>
            <div className="num-grid big">
              {Array.from({ length: bk.chapters }, (_, i) => i + 1).map((c) => {
                const n = counts.get(c) ?? 0;
                return (
                  <button
                    key={c}
                    className={`num${n ? ` rc-${Math.min(n, 3)}` : ''}`}
                    onClick={() => nav(`/read/${bk.id}/${c}`)}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <Tabs value={tab} onChange={setTab} items={[['old', '구약 (39)'], ['new', '신약 (27)']]} />
            <div className="book-grid">
              {BOOKS.filter((b) => b.testament === tab).map((b) => (
                <button
                  key={b.id}
                  className={b.id === lastBook?.id ? 'book active' : 'book'}
                  onClick={() => (b.chapters === 1 ? nav(`/read/${b.id}/1`) : setBook(b.id))}
                >
                  <span className="book-abbr">{b.abbr}</span>
                  <span className="book-name">{b.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
