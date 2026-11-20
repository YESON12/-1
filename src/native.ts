import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Share } from '@capacitor/share';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { KeepAwake } from '@capacitor-community/keep-awake';

/** Android APK(Capacitor) 안에서 실행 중인지 */
export const isNative = Capacitor.isNativePlatform();

/** 하드웨어 뒤로가기: 첫 화면에서는 종료 확인, 그 외에는 이전 화면 */
export function setupBackButton() {
  if (!isNative) return;
  App.addListener('backButton', () => {
    const atHome = location.hash === '' || location.hash === '#/' || location.hash === '#';
    if (atHome) {
      if (confirm('My Lovely Bible을 종료하시겠습니까?')) App.exitApp();
    } else {
      history.back();
    }
  });
}

/** 상태바 아이콘 색을 테마에 맞춤 (Dark = 어두운 배경용 밝은 아이콘) */
export function syncSystemBars(dark: boolean) {
  if (!isNative) return;
  SystemBars.setStyle({ style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(() => {});
}

export async function nativeShareText(text: string) {
  await Share.share({ text, dialogTitle: '공유하기' });
}

/** 앱 안에서는 <a download>가 동작하지 않아서 캐시에 파일을 쓰고 공유 창으로 내보냅니다. */
export async function nativeSaveFile(fileName: string, content: string) {
  const { uri } = await Filesystem.writeFile({
    path: fileName,
    data: content,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  await Share.share({ title: fileName, files: [uri], dialogTitle: '백업 파일 저장/보내기' });
}

export async function nativeKeepAwake(on: boolean) {
  if (!isNative) return;
  await (on ? KeepAwake.keepAwake() : KeepAwake.allowSleep()).catch(() => {});
}
