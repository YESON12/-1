import { Link } from 'react-router-dom';
import { bookById } from '../data/books';
import { useSettings } from '../settings';
import { useVersions } from '../hooks/useVersions';
import { Icon, type IconName } from '../components/icons';
import { NAMES } from '../theme';
import { useInstallPrompt } from './Home';

/** 자주 쓰는 4가지: 큰 칸 */
const MAIN: { to: string; label: string; icon: IconName; tone: string; desc: string }[] = [
  { to: '/books', label: NAMES.books, icon: 'book', tone: 'red', desc: '66권 본문' },
  { to: '/hymns', label: NAMES.hymns, icon: 'music', tone: 'green', desc: '새찬송가 가사' },
  { to: '/search', label: NAMES.search, icon: 'search', tone: 'blue', desc: '단어로 찾기' },
  { to: '/lists', label: NAMES.lists, icon: 'bookmark', tone: 'gold', desc: '형광펜 · 메모' },
];

/** 나머지: 목록 */
const MORE: { to: string; label: string; icon: IconName }[] = [
  { to: '/readings', label: NAMES.readings, icon: 'people' },
  { to: '/creed/lord', label: NAMES.lord, icon: 'pray' },
  { to: '/creed/apostles', label: NAMES.apostles, icon: 'cross' },
  { to: '/prayers', label: NAMES.prayers, icon: 'note' },
  { to: '/settings', label: NAMES.settings, icon: 'gear' },
  { to: '/help', label: NAMES.help, icon: 'help' },
];

/** 종이책 2 홈: 큰 아이콘 칸 4개 + 목록 */
export default function HomeEasy() {
  const { settings } = useSettings();
  const { versions } = useVersions();
  const install = useInstallPrompt();
  const last = settings.last;

  return (
    <div className="home easy-home">
      <header className="easy-hero">
        <h1>My Lovely Bible</h1>
        <p>성경과 찬송</p>
      </header>

      {versions && versions.length === 0 ? (
        <section className="card notice">
          <h2>성경 파일을 먼저 가져와 주세요</h2>
          <p>
            성경 데이터(<code>.bdb</code>) 파일을 한 번만 가져오면, 그다음부터는 인터넷 없이도 바로 열립니다.
          </p>
          <Link className="btn primary block" to="/settings#import">
            성경 파일 가져오기
          </Link>
        </section>
      ) : (
        last && (
          <Link className="card continue easy-continue" to={`/read/${last.book}/${last.chapter}`}>
            <span className="easy-continue-label">이어서 읽기</span>
            <b>
              {bookById(last.book).name} {last.chapter}장
            </b>
            <Icon name="chevron" size={28} />
          </Link>
        )
      )}

      <nav className="tiles" aria-label="주요 메뉴">
        {MAIN.map((m) => (
          <Link key={m.to} to={m.to} className={`tile tone-${m.tone}`}>
            <span className="tile-icon">
              <Icon name={m.icon} size={34} />
            </span>
            <span className="tile-label">{m.label}</span>
            <span className="tile-desc">{m.desc}</span>
          </Link>
        ))}
      </nav>

      <nav aria-label="더 보기">
        <ul className="more-list">
          {MORE.map((m) => (
            <li key={m.to}>
              <Link to={m.to}>
                <span className="more-icon">
                  <Icon name={m.icon} size={26} />
                </span>
                <span className="more-label">{m.label}</span>
                <Icon name="chevron" size={22} />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {install && (
        <button className="btn primary block" onClick={install}>
          홈 화면에 앱 설치
        </button>
      )}
    </div>
  );
}
