import { describe, expect, it } from 'vitest';
import { decodeText, detectKind, parseSongbook } from './songbook';

const HYMNS = `1. 만복의 근원 하나님
만복의 근원 하나님 온 백성 찬송 드리고
저 천사여 찬송하세 아멘

9. 하늘에 가득 찬 영광의 하나님
(1)하늘에 가득 찬 영광의 하나님
성부와 성자와 성령 삼위의 하나님
후렴: 우리 예배를 받아주시옵소서 아멘

(2)사랑이 넘치는 자비하신 하나님
찬송과 영광과 생명 구원의 하나님
`;

const READINGS = `1. 시편 1편
-복 있는 사람은
=오만한 자들의 자리에 앉지 아니하고
(다같이) 무릇 의인들의 길은 여호와께서 인정하시나(1-6)

2. 시편 2편
-어찌하여 이방 나라들이
=세상의 군왕들이 나서며
`;

describe('songbook', () => {
  it('찬송가: 번호·제목·절·후렴', () => {
    const songs = parseSongbook(HYMNS);
    expect(songs.map((s) => [s.kind, s.no, s.title])).toEqual([
      ['hymn', 1, '만복의 근원 하나님'],
      ['hymn', 9, '하늘에 가득 찬 영광의 하나님'],
    ]);
    expect(songs[0].blocks).toHaveLength(1);
    expect(songs[1].blocks.map((b) => b.label)).toEqual(['1', '후렴', '2']);
    expect(songs[1].blocks[0].lines[0].text).toBe('하늘에 가득 찬 영광의 하나님');
    expect(songs[1].blocks[1].lines[0].text).toBe('우리 예배를 받아주시옵소서 아멘');
  });

  it('교독문: 인도자·회중·다같이', () => {
    expect(detectKind(READINGS)).toBe('reading');
    const [first, second] = parseSongbook(READINGS);
    expect(first.title).toBe('시편 1편');
    expect(first.blocks[0].lines.map((l) => l.role)).toEqual(['leader', 'people', 'all']);
    expect(first.blocks[0].lines[2].text).toMatch(/^무릇/);
    expect(second.no).toBe(2);
  });

  it('EUC-KR 파일을 읽습니다', () => {
    // "1. 주" (EUC-KR: C1 D6)
    const bytes = new Uint8Array([0x31, 0x2e, 0x20, 0xc1, 0xd6, 0x0d, 0x0a]);
    expect(decodeText(bytes)).toBe('1. 주\n');
  });
});
