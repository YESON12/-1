import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Prayer, type PrayerStatus } from '../db/db';
import { Empty, Sheet, TopBar, useToast } from '../components/ui';

const STATUS: Record<PrayerStatus, { label: string; icon: string }> = {
  praying: { label: '기도중', icon: '🙏' },
  answered: { label: '응답받음', icon: '✅' },
  changed: { label: '변화됨', icon: '🔄' },
};

const blank = (): Prayer => ({
  title: '',
  content: '',
  tag: '',
  status: 'praying',
  insight: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export default function Prayers() {
  const toast = useToast();
  const prayers = useLiveQuery(() => db.prayers.orderBy('createdAt').reverse().toArray(), []);
  const [status, setStatus] = useState<PrayerStatus | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [edit, setEdit] = useState<Prayer | null>(null);

  const tags = [...new Set(prayers?.map((p) => p.tag).filter(Boolean))];
  const list = prayers?.filter((p) => (!status || p.status === status) && (!tag || p.tag === tag));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    if (!edit.title.trim()) {
      toast('기도제목을 입력해 주세요');
      return;
    }
    await db.prayers.put({ ...edit, title: edit.title.trim(), tag: edit.tag.trim(), updatedAt: Date.now() });
    setEdit(null);
  };

  return (
    <>
      <TopBar
        title="기도수첩"
        right={
          <button className="chip-btn" onClick={() => setEdit(blank())}>
            + 새 기도
          </button>
        }
      />
      <div className="page">
        <div className="chips">
          <button className={!status ? 'chip active' : 'chip'} onClick={() => setStatus(null)}>
            전체 {prayers?.length ?? ''}
          </button>
          {(Object.keys(STATUS) as PrayerStatus[]).map((s) => (
            <button key={s} className={status === s ? 'chip active' : 'chip'} onClick={() => setStatus(s)}>
              {STATUS[s].icon} {STATUS[s].label} {prayers?.filter((p) => p.status === s).length ?? ''}
            </button>
          ))}
        </div>
        {tags.length > 0 && (
          <div className="chips">
            <button className={!tag ? 'chip active' : 'chip'} onClick={() => setTag(null)}>
              모든 태그
            </button>
            {tags.map((t) => (
              <button key={t} className={tag === t ? 'chip active' : 'chip'} onClick={() => setTag(t)}>
                #{t}
              </button>
            ))}
          </div>
        )}

        {list && list.length === 0 && (
          <Empty>
            기도제목이 없습니다.
            <button className="btn primary" onClick={() => setEdit(blank())}>
              새 기도제목 입력
            </button>
          </Empty>
        )}

        <ul className="item-list">
          {list?.map((p) => (
            <li key={p.id}>
              <button className="item-main as-button" onClick={() => setEdit(p)}>
                <span className="ref">
                  {STATUS[p.status].icon} {p.title}
                  {p.tag && <span className="tag">#{p.tag}</span>}
                </span>
                {p.content && <span className="snippet">{p.content}</span>}
                {p.insight && <span className="memo">💡 {p.insight}</span>}
                <span className="muted small">{new Date(p.createdAt).toLocaleDateString('ko-KR')}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? '기도제목 수정' : '새 기도제목'}>
        {edit && (
          <form className="form" onSubmit={save}>
            <input
              className="input"
              autoFocus={!edit.id}
              placeholder="기도제목"
              value={edit.title}
              onChange={(e) => setEdit({ ...edit, title: e.target.value })}
            />
            <textarea
              className="input"
              rows={3}
              placeholder="기도 내용"
              value={edit.content}
              onChange={(e) => setEdit({ ...edit, content: e.target.value })}
            />
            <input
              className="input"
              placeholder="태그 (가정, 교회, 직장…)"
              value={edit.tag}
              list="prayer-tags"
              onChange={(e) => setEdit({ ...edit, tag: e.target.value })}
            />
            <datalist id="prayer-tags">
              {tags.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            <div className="chips">
              {(Object.keys(STATUS) as PrayerStatus[]).map((s) => (
                <button
                  type="button"
                  key={s}
                  className={edit.status === s ? 'chip active' : 'chip'}
                  onClick={() => setEdit({ ...edit, status: s })}
                >
                  {STATUS[s].icon} {STATUS[s].label}
                </button>
              ))}
            </div>
            <textarea
              className="input"
              rows={3}
              placeholder="응답 · 깨달음 기록"
              value={edit.insight}
              onChange={(e) => setEdit({ ...edit, insight: e.target.value })}
            />
            <div className="sheet-actions">
              {edit.id && (
                <button
                  type="button"
                  className="btn danger"
                  onClick={async () => {
                    if (confirm('이 기도제목을 삭제할까요?')) {
                      await db.prayers.delete(edit.id!);
                      setEdit(null);
                    }
                  }}
                >
                  삭제
                </button>
              )}
              <button className="btn primary">저장</button>
            </div>
          </form>
        )}
      </Sheet>
    </>
  );
}
