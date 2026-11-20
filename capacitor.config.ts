import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'kr.imyeson.mylovelybible',
  appName: 'My Lovely Bible',
  webDir: 'dist',
  plugins: {
    // Android 15+ 는 화면 끝까지(edge-to-edge) 그려집니다. 상태바/내비게이션바 높이를
    // --safe-area-inset-* CSS 변수로 받아 global.css 에서 여백으로 씁니다.
    SystemBars: {
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
    },
  },
};

export default config;
