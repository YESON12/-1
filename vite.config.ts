import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/** 앱(APK)에 넣을 성경. bundled-data/ 의 파일 → dist/bible/ 로 복사 */
const BUNDLED = [{ file: 'krv.bdb', name: '개역개정' }];

function bundleBibles(): Plugin {
  return {
    name: 'bundle-bibles',
    apply: 'build',
    closeBundle() {
      mkdirSync(resolve('dist/bible'), { recursive: true });
      for (const b of BUNDLED) {
        const src = resolve('bundled-data', b.file);
        if (!existsSync(src)) throw new Error(`성경 파일이 없습니다: ${src}`);
        copyFileSync(src, resolve('dist/bible', b.file));
      }
    },
  };
}

const FONTS =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600&family=Noto+Serif+KR:wght@400;500;600;700&display=swap';

/** paper 모드: 웹폰트 연결 + 상태바 색 */
function paperHtml(): Plugin {
  return {
    name: 'paper-html',
    transformIndexHtml(html) {
      return html
        .replace('content="#8a3b2e"', 'content="#f4eee2"')
        .replace(
          '</head>',
          `    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="${FONTS}" />
  </head>`,
        );
    },
  };
}

// base './' 는 GitHub Pages 하위 경로와 Capacitor(Android) 모두에서 동작하게 해 줍니다.
// `vite build --mode android` → 성경 데이터 포함, 서비스워커 없음 (APK 전용)
// `vite build --mode paper`   → 따뜻한 종이책 디자인 (별도 사이트로 배포)
export default defineConfig(({ mode }) => {
  const android = mode === 'android';
  const paper = mode === 'paper';
  return {
    base: './',
    define: {
      'import.meta.env.VITE_BUNDLED_BIBLES': JSON.stringify(android ? JSON.stringify(BUNDLED) : ''),
      __THEME__: JSON.stringify(paper ? 'paper' : 'default'),
    },
    resolve: {
      alias: {
        '@theme-css': resolve(paper ? 'src/styles/paper.css' : 'src/styles/theme-default.css'),
      },
    },
    plugins: [
      react(),
      android && bundleBibles(),
      paper && paperHtml(),
      // disable 이어도 virtual:pwa-register 모듈은 제공되어 App.tsx 가 그대로 빌드됨
      VitePWA({
            disable: android,
            registerType: 'prompt',
            includeAssets: ['favicon.svg'],
            manifest: {
              name: paper ? 'My Lovely Bible · 종이책' : 'My Lovely Bible',
              short_name: paper ? '성경 종이책' : 'MLB 성경',
              description: '성경읽기 · 역본비교 · 형광펜 · 메모 · 기도수첩',
              lang: 'ko',
              start_url: './',
              scope: './',
              display: 'standalone',
              orientation: 'portrait',
              background_color: paper ? '#f4eee2' : '#faf8f4',
              theme_color: paper ? '#f4eee2' : '#8a3b2e',
              icons: [
                { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,svg,png,wasm}'],
              maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
              // 종이책 디자인의 웹폰트를 한 번 받으면 오프라인에서도 쓰도록 저장
              runtimeCaching: paper
                ? [
                    {
                      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
                      handler: 'CacheFirst',
                      options: {
                        cacheName: 'google-fonts',
                        expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 365 },
                        cacheableResponse: { statuses: [0, 200] },
                      },
                    },
                  ]
                : undefined,
            },
          }),
    ],
    test: {
      environment: 'node',
    },
  } as never;
});
