import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { bookById, formatRef } from '../data/books';
import {
  chapterKey,
  chapterRange,
  db,
  HIGHLIGHT_COLORS,
  HIGHLIGHT_LABELS,
  verseKey,
  type HighlightColor,
  type Verse,
} from '../db/db';
import { useSettings } from '../settings';
import { useVersions } from '../hooks/useVersions';
import { useTTS } from '../hooks/useTTS';
import { isNative, nativeKeepAwake } from '../native';
import { copyText, Empty, Sheet, shareText, Tabs, TopBar, useToast, VerseText } from '../components/ui';
import { EASY } from '../theme';

const DEFAULT_TAGS = ['주일설교', '암송구절', '심방', 'QT'];
const clampInt = (v: string | undefined, lo: number, hi: number) => Math.min(Math.max(Number(v) || lo, lo), hi);

export default function Reader() {
  const params = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const { settings, update } = useSettings();
  const { versions, primary } = useVersions();

  const book = clampInt(params.book, 1, 66);
  const bk = bookById(book);
  const chapter = clampInt(params.chapter, 1, bk.chapters);
  const targetVerse = Number(sp.get('v')) || 0;

  const shown = useMemo(() => {
    if (!primary) return [];
    const extra = settings.compareOn
      ? settings.compareVersions.filter((c) => c !== primary && versions?.some((v) => v.code === c))
      : [];
    return [primary, ...extra];
  }, [primary, settings.compareOn, settings.compareVersions, versions]);

  const chapterData = useLiveQuery(
    () =>
      Promise.all(
        shown.map((code) => db.verses.where('[version+book+chapter]').equals([code, book, chapter]).toArray()),
      ),
    [shown.join('|'), book, chapter],
  );

  const [lo, hi] = chapterRange(book, chapter);
  const highlights = useLiveQuery(() => db.highlights.where('key').between(lo, hi).toArray(), [lo]);
  const memos = useLiveQuery(() => db.memos.where('key').between(lo, hi).toArray(), [lo]);
  const bookmarks = useLiveQuery(() => db.bookmarks.where('key').between(lo, hi).toArray(), [lo]);
  const record = useLiveQuery(() => db.readRecords.get(chapterKey(book, chapter)), [book, chapter]);
  const allTags = useLiveQuery(() => db.bookmarks.orderBy('tag').uniqueKeys(), []);

  const hlMap = useMemo(() => new Map(highlights?.map((h) => [h.verse, h.color])), [highlights]);
  const memoMap = useMemo(() => new Map(memos?.map((m) => [m.verse, m.text])), [memos]);
  const bmSet = useMemo(() => new Set(bookmarks?.map((b) => b.verse)), [bookmarks]);

  const [selected, setSelected] = useState<number[]>([]);
  const [panel, setPanel] = useState<null | 'chapter' | 'verse'>(null);
  const [sheet, setSheet] = useState<null | 'highlight' | 'memo' | 'bookmark' | 'version' | 'view'>(null);
  const [memoDraft, setMemoDraft] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const tts = useTTS(settings.ttsRate);
  const { stop: stopTTS } = tts;

  const primaryVerses: Verse[] = chapterData?.[0] ?? [];
  const textOf = (v: number) => primaryVerses.find((x) => x.verse === v)?.text ?? '';
  const sortedSel = [...selected].sort((a, b) => a - b);
  // 역본 목록을 불러오는 동안(primary 없음)이나 이전 장 결과가 남아 있을 때는 아직 준비 전으로 봅니다.
  const loaded = !!primary && chapterData?.length === shown.length;
  const ready = loaded && primaryVerses.length > 0 && primaryVerses[0].book === book && primaryVerses[0].chapter === chapter;

  useEffect(() => {
    setSelected([]);
    setPanel(null);
    stopTTS();
  }, [book, chapter, stopTTS]);

  useEffect(() => {
    db.history.put({ key: chapterKey(book, chapter), book, chapter, at: Date.now() });
    update({ last: { book, chapter } });
  }, [book, chapter, update]);

  useEffect(() => {
    if (!ready) return;
    if (!targetVerse) {
      window.scrollTo(0, 0);
      return;
    }
    const el = document.getElementById(`v${targetVerse}`);
    el?.scrollIntoView({ block: 'center' });
    el?.classList.add('flash');
    const t = setTimeout(() => el?.classList.remove('flash'), 1800);
    return () => clearTimeout(t);
  }, [ready, book, chapter, targetVerse]);

  // 읽는 동안 화면 꺼짐 방지
  useEffect(() => {
    if (isNative) {
      nativeKeepAwake(true);
      return () => void nativeKeepAwake(false);
    }
    let lock: WakeLockSentinel | null = null;
    const request = async () => {
      try {
        lock = (await navigator.wakeLock?.request('screen')) ?? null;
      } catch {
        /* 지원 안 함 */
      }
    };
    request();
    const onVis = () => document.visibilityState === 'visible' && request();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      lock?.release().catch(() => {});
    };
  }, []);

  const go = (b: number, c: number, v?: number) => nav(`/read/${b}/${c}${v ? `?v=${v}` : ''}`, { replace: true });
  const prev = () => (chapter > 1 ? go(book, chapter - 1) : book > 1 && go(book - 1, bookById(book - 1).chapters));
  const next = () => (chapter < bk.chapters ? go(book, chapter + 1) : book < 66 && go(book + 1, 1));
  const hasPrev = book > 1 || chapter > 1;
  const hasNext = book < 66 || chapter < bk.chapters;

  // 좌우 스와이프 = 이전/다음 장, 두 손가락 = 글씨 크기
  const touch = useRef<{ x: number; y: number; t: number; dist?: number; size?: number } | null>(null);
  const dist = (t: React.TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) touch.current = { x: 0, y: 0, t: 0, dist: dist(e.touches), size: settings.fontSize };
    else if (e.touches.length === 1)
      touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const s = touch.current;
    if (e.touches.length === 2 && s?.dist && s.size) {
      const size = Math.min(40, Math.max(12, Math.round((s.size * dist(e.touches)) / s.dist)));
      if (size !== settings.fontSize) update({ fontSize: size });
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current;
    if (s && !s.dist && e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - s.x;
      const dy = e.changedTouches[0].clientY - s.y;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8 && Date.now() - s.t < 700) {
        if (dx < 0) next();
        else prev();
      }
    }
    if (e.touches.length === 0) touch.current = null;
  };

  const toggle = (v: number) =>
    setSelected((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  const versionName = (code: string) => versions?.find((v) => v.code === code)?.name ?? code;
  const selectionText = () => {
    const body =
      sortedSel.length === 1
        ? textOf(sortedSel[0])
        : sortedSel.map((v) => `${v} ${textOf(v)}`).join('\n');
    return `${body}\n(${formatRef(book, chapter, sortedSel)}, ${versionName(primary ?? '')})`;
  };

  const doCopy = async () => {
    toast((await copyText(selectionText())) ? '복사했습니다' : '복사하지 못했습니다');
    setSelected([]);
  };
  const doShare = async () => {
    const r = await shareText(selectionText());
    if (r === 'copied') toast('공유 기능이 없어 복사했습니다');
    if (r !== 'failed') setSelected([]);
  };
  const applyHighlight = async (color: HighlightColor | null) => {
    if (color) {
      await db.highlights.bulkPut(
        sortedSel.map((v) => ({ key: verseKey(book, chapter, v), book, chapter, verse: v, color, createdAt: Date.now() })),
      );
      update({ highlightColor: color });
    } else {
      await db.highlights.bulkDelete(sortedSel.map((v) => verseKey(book, chapter, v)));
    }
    setSheet(null);
    setSelected([]);
  };
  const openMemo = () => {
    setMemoDraft(memoMap.get(sortedSel[0]) ?? '');
    setSheet('memo');
  };
  const saveMemo = async (text: string) => {
    const keys = sortedSel.map((v) => verseKey(book, chapter, v));
    if (text.trim()) {
      await db.memos.bulkPut(
        sortedSel.map((v, i) => ({ key: keys[i], book, chapter, verse: v, text: text.trim(), updatedAt: Date.now() })),
      );
      toast('메모를 저장했습니다');
    } else {
      await db.memos.bulkDelete(keys);
      toast('메모를 지웠습니다');
    }
    setSheet(null);
    setSelected([]);
  };
  const saveBookmark = async (tag: string) => {
    await db.transaction('rw', db.bookmarks, async () => {
      for (const v of sortedSel) {
        const key = verseKey(book, chapter, v);
        const existing = await db.bookmarks.where('key').equals(key).first();
        if (existing) await db.bookmarks.update(existing.id!, { tag });
        else await db.bookmarks.add({ key, book, chapter, verse: v, tag, createdAt: Date.now() });
      }
    });
    toast('북마크에 저장했습니다');
    setSheet(null);
    setSelected([]);
  };
  const listen = (from: number | null) => {
    const items = from
      ? primaryVerses.filter((v) => v.verse >= from)
      : primaryVerses.filter((v) => sortedSel.includes(v.verse));
    if (!tts.speak(items.map((v) => ({ id: v.verse, text: v.text })))) toast('이 기기에서는 음성 읽기를 지원하지 않습니다');
    setSelected([]);
  };
  const changeRead = async (delta: number) => {
    const key = chapterKey(book, chapter);
    const count = Math.max(0, (record?.count ?? 0) + delta);
    if (count === 0) await db.readRecords.delete(key);
    else await db.readRecords.put({ key, book, chapter, count, lastAt: Date.now() });
    toast(delta > 0 ? `읽은 횟수 ${count}회` : `1회 취소, 총 ${count}회`);
  };

  const readerStyle = {
    '--reader-font-size': `${settings.fontSize}px`,
    '--reader-line-height': settings.lineHeight,
    ...(settings.colors.bg && { '--reader-bg': settings.colors.bg }),
    ...(settings.colors.text && { '--reader-text': settings.colors.text }),
    ...(settings.colors.verseNum && { '--reader-num': settings.colors.verseNum }),
    ...(settings.colors.memo && { '--reader-memo': settings.colors.memo }),
  } as CSSProperties;

  if (versions && versions.length === 0) {
    return (
      <>
        <TopBar title="성경읽기" />
        <Empty>
          아직 성경 파일이 없습니다.
          <Link className="btn primary" to="/settings#import">
            성경 파일 가져오기
          </Link>
        </Empty>
      </>
    );
  }

  const compareCount = shown.length;

  return (
    <div
      className={`reader font-${settings.fontFamily}${settings.showDividers ? ' dividers' : ''}`}
      style={readerStyle}
    >
      <TopBar
        title={
          <>
            {bk.name} {chapter}장 <span className="caret">▾</span>
          </>
        }
        onTitleClick={() => setPanel(panel ? null : 'chapter')}
        right={
          <>
            <button className="chip-btn" onClick={() => setSheet('version')}>
              {compareCount > 1 ? `비교 ${compareCount}` : versionName(primary ?? '')}
            </button>
            <button
              className="icon-btn"
              aria-label={tts.speaking ? '듣기 중지' : '장 전체 듣기'}
              onClick={() => (tts.speaking ? tts.stop() : listen(1))}
            >
              {tts.speaking ? '■' : '🔊'}
            </button>
            <button className="icon-btn" aria-label="보기 설정" onClick={() => setSheet('view')}>
              {EASY ? '글씨' : 'Aa'}
            </button>
          </>
        }
      />

      {panel && (
        <div className="jump-panel">
          <div className="jump-head">
            <Tabs value={panel} onChange={setPanel} items={[['chapter', '장'], ['verse', '절']]} />
            <Link className="btn small" to="/books">
              다른 책
            </Link>
          </div>
          <div className="num-grid">
            {panel === 'chapter'
              ? Array.from({ length: bk.chapters }, (_, i) => i + 1).map((c) => (
                  <button key={c} className={c === chapter ? 'num active' : 'num'} onClick={() => go(book, c)}>
                    {c}
                  </button>
                ))
              : primaryVerses.map((v) => (
                  <button
                    key={v.verse}
                    className="num"
                    onClick={() => {
                      setPanel(null);
                      go(book, chapter, v.verse);
                    }}
                  >
                    {v.verse}
                  </button>
                ))}
          </div>
        </div>
      )}

      <main
        className="reader-body"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {loaded && primaryVerses.length === 0 && <Empty>이 역본에는 {bk.name} {chapter}장 본문이 없습니다.</Empty>}
        {primaryVerses.map((pv) => {
          const v = pv.verse;
          const hl = hlMap.get(v);
          const memo = memoMap.get(v);
          const cls = [
            'verse',
            selected.includes(v) && 'selected',
            hl && `hl-${hl}`,
            tts.current === v && 'reading',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <div key={v} id={`v${v}`} className={cls} onClick={() => toggle(v)}>
              <span className="vnum">
                {v}
                {bmSet.has(v) && <span className="bm-mark" aria-label="북마크">★</span>}
              </span>
              <div className="vbody">
                {compareCount > 1 ? (
                  shown.map((code, i) => {
                    const t = chapterData?.[i]?.find((x) => x.verse === v)?.text;
                    return (
                      <p key={code} className="cmp-line">
                        <span className="cmp-label">{versionName(code)}</span>
                        {t ? <VerseText text={t} /> : <span className="muted">—</span>}
                      </p>
                    );
                  })
                ) : (
                  <p className="vtext">
                    <VerseText text={pv.text} />
                  </p>
                )}
                {memo &&
                  (settings.showMemos ? (
                    <p className="memo">¶ {memo}</p>
                  ) : (
                    <span className="memo-mark" aria-label="메모 있음">¶</span>
                  ))}
              </div>
            </div>
          );
        })}

        {ready && (
          <footer className="chapter-foot">
            <div className="read-count">
              <span>
                이 장을 <b>{record?.count ?? 0}</b>회 읽었어요
              </span>
              <button className="btn primary small" onClick={() => changeRead(1)}>
                읽음 +1
              </button>
              {!!record?.count && (
                <button className="btn small" onClick={() => changeRead(-1)}>
                  취소
                </button>
              )}
            </div>
            <div className="chapter-nav">
              <button className="btn" disabled={!hasPrev} onClick={prev}>
                ‹ 이전 장
              </button>
              <button className="btn" disabled={!hasNext} onClick={next}>
                다음 장 ›
              </button>
            </div>
          </footer>
        )}
      </main>

      {settings.showArrows && selected.length === 0 && (
        <>
          {hasPrev && (
            <button className="float-arrow left" aria-label="이전 장" onClick={prev}>
              ‹
            </button>
          )}
          {hasNext && (
            <button className="float-arrow right" aria-label="다음 장" onClick={next}>
              ›
            </button>
          )}
        </>
      )}

      {selected.length > 0 && (
        <div className="action-bar">
          <div className="action-head">
            <b>{formatRef(book, chapter, sortedSel)}</b>
            <button className="link-btn" onClick={() => setSelected([])}>
              선택 해제
            </button>
          </div>
          <div className="action-row">
            <button onClick={doCopy}>복사</button>
            <button onClick={doShare}>공유</button>
            <button onClick={() => setSheet('highlight')}>형광펜</button>
            <button onClick={openMemo}>메모</button>
            <button
              onClick={() => {
                setTagDraft('');
                setSheet('bookmark');
              }}
            >
              북마크
            </button>
            <button onClick={() => listen(null)}>듣기</button>
            <button onClick={() => listen(sortedSel[0])}>여기부터 듣기</button>
            <button onClick={() => setSelected(primaryVerses.map((v) => v.verse))}>모두 선택</button>
          </div>
        </div>
      )}

      <Sheet open={sheet === 'highlight'} onClose={() => setSheet(null)} title="형광펜">
        <div className="color-row">
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c}
              className={`swatch hl-${c}${settings.highlightColor === c ? ' active' : ''}`}
              aria-label={HIGHLIGHT_LABELS[c]}
              onClick={() => applyHighlight(c)}
            />
          ))}
        </div>
        <button className="btn block" onClick={() => applyHighlight(null)}>
          형광펜 지우기
        </button>
      </Sheet>

      <Sheet open={sheet === 'memo'} onClose={() => setSheet(null)} title={`메모 · ${formatRef(book, chapter, sortedSel)}`}>
        <textarea
          className="input"
          rows={5}
          autoFocus
          value={memoDraft}
          placeholder="이 구절과 함께 저장할 메모"
          onChange={(e) => setMemoDraft(e.target.value)}
        />
        <div className="sheet-actions">
          {memoMap.has(sortedSel[0]) && (
            <button className="btn danger" onClick={() => saveMemo('')}>
              메모 지우기
            </button>
          )}
          <button className="btn primary" onClick={() => saveMemo(memoDraft)}>
            저장
          </button>
        </div>
      </Sheet>

      <Sheet open={sheet === 'bookmark'} onClose={() => setSheet(null)} title="북마크 · 분류 태그">
        <input
          className="input"
          value={tagDraft}
          placeholder="태그 (비워도 됩니다)"
          onChange={(e) => setTagDraft(e.target.value)}
        />
        <div className="chips">
          {[...new Set([...DEFAULT_TAGS, ...((allTags as string[]) ?? []).filter(Boolean)])].map((t) => (
            <button key={t} className={tagDraft === t ? 'chip active' : 'chip'} onClick={() => setTagDraft(t)}>
              {t}
            </button>
          ))}
        </div>
        <button className="btn primary block" onClick={() => saveBookmark(tagDraft.trim())}>
          북마크 저장
        </button>
      </Sheet>

      <Sheet open={sheet === 'version'} onClose={() => setSheet(null)} title="역본 선택">
        <p className="hint">기본 역본</p>
        <div className="option-list">
          {versions?.map((v) => (
            <label key={v.code} className="option">
              <input
                type="radio"
                name="primary"
                checked={primary === v.code}
                onChange={() => update({ primaryVersion: v.code })}
              />
              {v.name}
            </label>
          ))}
        </div>
        {versions && versions.length > 1 ? (
          <>
            <label className="option switch">
              <input
                type="checkbox"
                checked={settings.compareOn}
                onChange={(e) => update({ compareOn: e.target.checked })}
              />
              다른 역본과 비교하기
            </label>
            {settings.compareOn && (
              <>
                <p className="hint">함께 볼 역본 (선택한 순서대로 표시)</p>
                <div className="option-list">
                  {versions
                    .filter((v) => v.code !== primary)
                    .map((v) => {
                      const idx = settings.compareVersions.indexOf(v.code);
                      return (
                        <label key={v.code} className="option">
                          <input
                            type="checkbox"
                            checked={idx >= 0}
                            onChange={() =>
                              update({
                                compareVersions:
                                  idx >= 0
                                    ? settings.compareVersions.filter((c) => c !== v.code)
                                    : [...settings.compareVersions, v.code],
                              })
                            }
                          />
                          {v.name}
                          {idx >= 0 && <span className="order-badge">{idx + 1}</span>}
                        </label>
                      );
                    })}
                </div>
              </>
            )}
          </>
        ) : (
          <p className="hint">
            다른 역본(.bdb)을 <Link to="/settings#import">가져오면</Link> 나란히 비교해 볼 수 있습니다.
          </p>
        )}
      </Sheet>

      <Sheet open={sheet === 'view'} onClose={() => setSheet(null)} title="보기 설정">
        <div className="stepper">
          <span>글씨 크기</span>
          <button className="btn small" onClick={() => update({ fontSize: Math.max(12, settings.fontSize - 1) })}>
            가−
          </button>
          <b>{settings.fontSize}</b>
          <button className="btn small" onClick={() => update({ fontSize: Math.min(40, settings.fontSize + 1) })}>
            가+
          </button>
        </div>
        <label className="option switch">
          <input type="checkbox" checked={settings.showDividers} onChange={(e) => update({ showDividers: e.target.checked })} />
          절 사이 구분선
        </label>
        <label className="option switch">
          <input type="checkbox" checked={settings.showArrows} onChange={(e) => update({ showArrows: e.target.checked })} />
          좌우 화살표 버튼
        </label>
        <label className="option switch">
          <input type="checkbox" checked={settings.showMemos} onChange={(e) => update({ showMemos: e.target.checked })} />
          메모 내용 보이기
        </label>
        <Link className="btn block" to="/settings">
          색상 · 글꼴 · 테마 설정
        </Link>
      </Sheet>
    </div>
  );
}
