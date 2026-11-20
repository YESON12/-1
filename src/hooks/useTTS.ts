import { useCallback, useEffect, useRef, useState } from 'react';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { isNative } from '../native';

export interface SpeakItem {
  id: number;
  text: string;
}

function pickVoice(lang: string) {
  const voices = speechSynthesis.getVoices();
  return voices.find((v) => v.lang.replace('_', '-').toLowerCase().startsWith(lang)) ?? null;
}

const looksKorean = (s: string) => /[가-힣]/.test(s);
const clean = (s: string) => s.replace(/[[\]()]/g, ' ');

/**
 * 구절을 차례로 읽습니다. 읽는 중인 항목 id를 돌려줍니다.
 * 브라우저는 speechSynthesis, 안드로이드 앱은 기기 TTS 엔진(웹뷰에는 speechSynthesis가 없음)을 씁니다.
 */
export function useTTS(rate: number) {
  const supported = isNative || (typeof window !== 'undefined' && 'speechSynthesis' in window);
  const [current, setCurrent] = useState<number | null>(null);
  const run = useRef(0);

  const stop = useCallback(() => {
    run.current++;
    if (isNative) TextToSpeech.stop().catch(() => {});
    else if (supported) speechSynthesis.cancel();
    setCurrent(null);
  }, [supported]);

  useEffect(() => stop, [stop]);

  const speak = useCallback(
    (items: SpeakItem[]) => {
      if (!supported || items.length === 0) return false;
      stop();
      const id = run.current;

      if (isNative) {
        (async () => {
          for (const item of items) {
            if (run.current !== id) return;
            setCurrent(item.id);
            try {
              await TextToSpeech.speak({
                text: clean(item.text),
                lang: looksKorean(item.text) ? 'ko-KR' : 'en-US',
                rate,
              });
            } catch {
              break;
            }
          }
          if (run.current === id) setCurrent(null);
        })();
        return true;
      }

      items.forEach((item, i) => {
        const u = new SpeechSynthesisUtterance(clean(item.text));
        const lang = looksKorean(item.text) ? 'ko' : 'en';
        u.lang = lang === 'ko' ? 'ko-KR' : 'en-US';
        const voice = pickVoice(lang);
        if (voice) u.voice = voice;
        u.rate = rate;
        u.onstart = () => run.current === id && setCurrent(item.id);
        if (i === items.length - 1) u.onend = () => run.current === id && setCurrent(null);
        speechSynthesis.speak(u);
      });
      return true;
    },
    [supported, rate, stop],
  );

  return { supported, speaking: current !== null, current, speak, stop };
}
