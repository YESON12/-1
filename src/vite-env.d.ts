interface ImportMetaEnv {
  /** 앱(APK) 빌드에 넣은 성경 목록 JSON: [{ file, name }] */
  readonly VITE_BUNDLED_BIBLES?: string;
}

/** 'paper' = 따뜻한 종이책 디자인 빌드 (`vite build --mode paper`) */
declare const __THEME__: 'default' | 'paper';

declare module '@theme-css';
