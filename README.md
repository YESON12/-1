# My Lovely Bible (PWA)

2011년 안드로이드 앱 "My Lovely Bible v2.6.7"을 최신 브라우저와 Android 16에서 쓸 수 있게 다시 만든 웹앱입니다.

## 실행

```bash
npm install
npm run dev          # http://localhost:5173
npm run dev -- --host   # 같은 와이파이의 휴대폰에서 확인
npm test             # 단위 테스트
npm run build        # dist/ 에 배포용 파일 생성
npm run preview      # 빌드 결과 확인 (오프라인/설치 기능 포함)
```

## 성경 데이터

- 앱에는 성경 본문이 들어 있지 않습니다(저작권). 설정 → **성경 파일 가져오기**에서 베들레헴 성경 `.bdb` 파일을 선택합니다.
- `.bdb` = SQLite 파일, 테이블 `Bible(book, chapter, verse, btext)`. UTF-8(옛 파일은 EUC-KR 자동 인식).
- 가져온 본문은 IndexedDB에 저장되어 다시 가져올 필요가 없습니다. 파일명이 역본 이름이 됩니다(예: `개역개정.bdb` → 개역개정).
- `sample-data/`, `*.bdb` 는 `.gitignore`에 들어 있어 저장소·배포물에 포함되지 않습니다.

## 구조

| 경로 | 내용 |
|---|---|
| `src/data/books.ts` | 66권 이름·약어·장 수, "요3:16" 해석 |
| `src/data/creeds.ts` | 주기도문·사도신경 (새번역/구버전/영문) |
| `src/db/db.ts` | Dexie(IndexedDB) 스키마 |
| `src/db/importBdb.ts` | .bdb 가져오기 (sql.js) |
| `src/db/backup.ts` | 사용자 데이터 JSON 백업/복원 |
| `src/pages/Reader.tsx` | 성경읽기 (선택 메뉴, 형광펜, 메모, 북마크, 역본비교, 듣기, 스와이프, 핀치줌) |
| `src/pages/*` | 본문선택, 검색, 통합리스트, 기도수첩, 신앙고백, 설정, 사용설명 |
| `scripts/make-icons.py` | 앱 아이콘 PNG 생성 |

## 남은 작업

- 새찬송가(`new_song.txt`)·교독문(`교독문.txt`) — 데이터 파일을 받으면 형식 확인 후 연결
- https 배포 (GitHub Pages / Netlify)
- Capacitor로 Android 16 APK (Android Studio 필요)
