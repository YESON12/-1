interface ImportMetaEnv {
  /** 앱(APK) 빌드에 넣은 성경 목록 JSON: [{ file, name }] */
  readonly VITE_BUNDLED_BIBLES?: string;
}

/** 'paper' = 따뜻한 종이책, 'paper2' = 종이책 2 (중년층용 큰 글씨) — `vite build --mode paper|paper2` */
declare const __THEME__: 'default' | 'paper' | 'paper2';

declare module '@theme-css';
