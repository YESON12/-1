"""앱 아이콘 PNG 생성 (외부 라이브러리 없이).
실행: python scripts/make-icons.py   → public/icons (PWA) + android/app/src/main/res (APK, 폴더가 있을 때)
"""
import struct, zlib, pathlib

BG = (138, 59, 46)      # #8a3b2e
PAGE = (250, 248, 244)  # #faf8f4
ROOT = pathlib.Path(__file__).resolve().parent.parent
RES = ROOT / 'android' / 'app' / 'src' / 'main' / 'res'


def png(path, w, h, pixels):
    raw = b''.join(b'\x00' + bytes(c for px in pixels[y * w:(y + 1) * w] for c in px) for y in range(h))
    def chunk(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
    data += chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def symbol(u, v):
    """0~1 좌표에서 십자가 + 펼친 책 모양이면 True"""
    sag = 0.05 * (1 - abs(u - 0.5) * 2)
    book = 0.12 <= u <= 0.88 and 0.58 + sag <= v <= 0.84 + sag and abs(u - 0.5) > 0.012
    cross = (0.455 <= u <= 0.545 and 0.12 <= v <= 0.56) or (0.33 <= u <= 0.67 and 0.24 <= v <= 0.33)
    return book or cross


def draw(w, h, shape='rounded', scale=0.78, bg=BG, fg=PAGE, sym_size=None):
    """shape: rounded | circle | square | none(투명 배경)"""
    s = min(w, h) if sym_size is None else sym_size
    radius = min(w, h) * 0.22
    px = []
    for y in range(h):
        for x in range(w):
            fx, fy = x + 0.5, y + 0.5
            if shape == 'rounded':
                cx = min(max(fx, radius), w - radius)
                cy = min(max(fy, radius), h - radius)
                inside = (fx - cx) ** 2 + (fy - cy) ** 2 <= radius ** 2
            elif shape == 'circle':
                inside = (fx - w / 2) ** 2 + (fy - h / 2) ** 2 <= (min(w, h) / 2) ** 2
            else:
                inside = True
            u = ((fx - w / 2) / s) / scale + 0.5
            v = ((fy - h / 2) / s) / scale + 0.5
            if symbol(u, v):
                px.append(fg + (255,))
            elif inside and shape != 'none':
                px.append(bg + (255,))
            else:
                px.append((0, 0, 0, 0))
    return px


# PWA
for name, size, shape, scale in [('icon-192', 192, 'rounded', 0.78), ('icon-512', 512, 'rounded', 0.78),
                                 ('maskable-512', 512, 'square', 0.62)]:
    png(ROOT / 'public' / 'icons' / f'{name}.png', size, size, draw(size, size, shape, scale))

# Android
if RES.exists():
    for dpi, base in [('mdpi', 48), ('hdpi', 72), ('xhdpi', 96), ('xxhdpi', 144), ('xxxhdpi', 192)]:
        png(RES / f'mipmap-{dpi}' / 'ic_launcher.png', base, base, draw(base, base, 'rounded'))
        png(RES / f'mipmap-{dpi}' / 'ic_launcher_round.png', base, base, draw(base, base, 'circle', 0.7))
        fg = base * 108 // 48  # 적응형 아이콘 전경 108dp, 안쪽 66dp 안에 그림
        png(RES / f'mipmap-{dpi}' / 'ic_launcher_foreground.png', fg, fg, draw(fg, fg, 'none', 0.5))
    # 시작 화면: 밝은 배경 가운데에 아이콘
    for f in RES.glob('drawable*/splash.png'):
        w, h = struct.unpack('>II', f.read_bytes()[16:24])
        icon = min(w, h) * 0.32
        pixels = draw(w, h, 'none', 1.0, fg=BG, sym_size=icon)
        png(f, w, h, [p if p[3] else PAGE + (255,) for p in pixels])
    (RES / 'values' / 'ic_launcher_background.xml').write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
        '    <color name="ic_launcher_background">#8A3B2E</color>\n</resources>\n', encoding='utf-8')

print('icons written')
