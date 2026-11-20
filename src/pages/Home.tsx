import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookById } from '../data/books';
import { useSettings } from '../settings';
import { useVersions } from '../hooks/useVersions';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

/** 브라우저가 "앱 설치"를 제안할 수 있을 때 설치 함수를 돌려줍니다 */
export function useInstallPrompt() {
  const [evt, setEvt] = useState<InstallPromptEvent | null>(null);
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);
  return evt
    ? async () => {
        await evt.prompt();
        setEvt(null);
      }
    : null;
}

const MENU: { to: string; label: string; icon: string; desc: string }[] = [
  { to: '/books', label: '성경읽기', icon: '📖', desc: '66권 본문' },
  { to: '/lists', label: '통합리스트', icon: '🔖', desc: '북마크 · 형광펜 · 메모' },
  { to: '/search', label: '단어검색', icon: '🔍', desc: '말씀 찾기' },
  { to: '/hymns', label: '새찬송가', icon: '🎵', desc: '찬송' },
  { to: '/readings', label: '교독문', icon: '📜', desc: '함께 읽기' },
  { to: '/creed/lord', label: '주기도문', icon: '🙏', desc: '기도' },
  { to: '/creed/apostles', label: '사도신경', icon: '✝️', desc: '신앙고백' },
  { to: '/prayers', label: '기도수첩', icon: '📝', desc: '기도 제목' },
  { to: '/settings', label: '설정', icon: '⚙️', desc: '글꼴 · 색 · 성경 파일' },
  { to: '/help', label: '사용설명', icon: '❔', desc: '도움말' },
];

const PAPER = __THEME__ === 'paper';

function Ornament() {
  return (
    <svg className="cover-orn" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 3v18M7 8h10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function Toc() {
  return (
    <nav aria-label="목차">
      <h2 className="toc-title">목 차</h2>
      <ol className="toc">
        {MENU.map((m, i) => (
          <li key={m.to}>
            <Link to={m.to}>
              <span className="toc-no">{String(i + 1).padStart(2, '0')}</span>
              <span className="toc-label">{m.label}</span>
              <span className="toc-dots" aria-hidden />
              <span className="toc-desc">{m.desc}</span>
              <span className="toc-arrow" aria-hidden>
                ›
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function Home() {
  const { settings } = useSettings();
  const { versions } = useVersions();
  const install = useInstallPrompt();
  const last = settings.last;

  return (
    <div className="home">
      {PAPER ? (
        <header className="cover">
          <Ornament />
          <p className="cover-kicker">HOLY BIBLE</p>
          <h1>My Lovely Bible</h1>
          <p className="cover-sub">성경과 찬송</p>
        </header>
      ) : (
        <header className="home-hero">
          <h1>My Lovely Bible</h1>
          <p>성경과 찬송</p>
        </header>
      )}

      {versions && versions.length === 0 ? (
        <section className="card notice">
          <h2>성경 파일을 먼저 가져와 주세요</h2>
          <p>
            가지고 계신 성경 데이터(<code>.bdb</code>) 파일을 한 번만 가져오면, 그다음부터는 인터넷 없이도 바로
            열립니다.
          </p>
          <Link className="btn primary block" to="/settings#import">
            성경 파일 가져오기
          </Link>
        </section>
      ) : (
        last && (
          <Link className="card continue" to={`/read/${last.book}/${last.chapter}`}>
            <span className="muted">이어서 읽기</span>
            <b>
              {bookById(last.book).name} {last.chapter}장
            </b>
          </Link>
        )
      )}

      {PAPER ? (
        <Toc />
      ) : (
        <nav className="menu-grid">
          {MENU.map((m) => (
            <Link key={m.to} to={m.to} className="menu-item">
              <span className="menu-icon" aria-hidden>
                {m.icon}
              </span>
              {m.label}
            </Link>
          ))}
        </nav>
      )}

      {install && (
        <button className="btn block" onClick={install}>
          {PAPER ? '홈 화면에 앱 설치' : '📲 홈 화면에 앱 설치'}
        </button>
      )}

      {PAPER && <p className="home-foot">주의 말씀은 내 발에 등이요 내 길에 빛이니이다 · 시편 119:105</p>}
    </div>
  );
}
