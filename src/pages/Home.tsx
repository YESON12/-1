import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookById } from '../data/books';
import { useSettings } from '../settings';
import { useVersions } from '../hooks/useVersions';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

const MENU: { to: string; label: string; icon: string }[] = [
  { to: '/books', label: '성경읽기', icon: '📖' },
  { to: '/lists', label: '통합리스트', icon: '🔖' },
  { to: '/search', label: '단어검색', icon: '🔍' },
  { to: '/hymns', label: '새찬송가', icon: '🎵' },
  { to: '/readings', label: '교독문', icon: '📜' },
  { to: '/creed/lord', label: '주기도문', icon: '🙏' },
  { to: '/creed/apostles', label: '사도신경', icon: '✝️' },
  { to: '/prayers', label: '기도수첩', icon: '📝' },
  { to: '/settings', label: '설정', icon: '⚙️' },
  { to: '/help', label: '사용설명', icon: '❔' },
];

export default function Home() {
  const { settings } = useSettings();
  const { versions } = useVersions();
  const [installEvt, setInstallEvt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as InstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const last = settings.last;

  return (
    <div className="home">
      <header className="home-hero">
        <h1>My Lovely Bible</h1>
        <p>성경과 찬송</p>
      </header>

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

      {installEvt && (
        <button
          className="btn block"
          onClick={async () => {
            await installEvt.prompt();
            setInstallEvt(null);
          }}
        >
          📲 홈 화면에 앱 설치
        </button>
      )}
    </div>
  );
}
