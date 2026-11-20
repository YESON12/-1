/** 빌드 모드별 디자인: default(기존) · paper(종이책) · paper2(종이책 2: 중년층용 큰 글씨) */
export const THEME = __THEME__;
export const PAPER = THEME === 'paper' || THEME === 'paper2';
/** 종이책 2: 큰 글씨 · 진한 대비 · 아이콘 메뉴 · 쉬운 이름 */
export const EASY = THEME === 'paper2';

/** 화면 이름 — 종이책 2에서는 더 쉬운 말로 */
export const NAMES = {
  books: EASY ? '성경 읽기' : '성경읽기',
  lists: EASY ? '내 표시 모음' : '통합리스트',
  search: EASY ? '말씀 찾기' : '단어검색',
  hymns: EASY ? '찬송가' : '새찬송가',
  readings: '교독문',
  lord: '주기도문',
  apostles: '사도신경',
  prayers: '기도수첩',
  settings: '설정',
  help: EASY ? '사용법' : '사용설명',
} as const;
