#!/usr/bin/env python3
"""Generate PWA PNG icons without extra Python deps."""
from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "public" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

NAVY = (14, 23, 20, 255)
MINT = (125, 206, 160, 255)
GOLD = (244, 211, 94, 255)
CREAM = (255, 248, 235, 255)
PINK = (224, 122, 95, 255)


def lerp(a, b, t):
    return int(a + (b - a) * t)


def png(width: int, height: int, pixels: list[tuple[int, int, int, int]]) -> bytes:
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        start = y * width
        for x in range(width):
            raw.extend(pixels[start + x])

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )


def circle(px, py, cx, cy, r):
    return math.hypot(px - cx, py - cy) <= r


def blend(dst, src):
    sr, sg, sb, sa = src
    if sa == 255:
        return src
    if sa == 0:
        return dst
    a = sa / 255
    return (
        lerp(dst[0], sr, a),
        lerp(dst[1], sg, a),
        lerp(dst[2], sb, a),
        255,
    )


def paint_icon(size: int, maskable: bool) -> list[tuple[int, int, int, int]]:
    pad = int(size * 0.18) if maskable else int(size * 0.08)
    cx = cy = size / 2
    r = size / 2 - pad
    pixels = []
    for y in range(size):
        for x in range(size):
            color = NAVY
            # soft vignette disk
            d = math.hypot(x - cx, y - cy) / (size / 2)
            if d < 1:
                t = max(0, 1 - d)
                color = (
                    lerp(NAVY[0], 22, t * 0.4),
                    lerp(NAVY[1], 42, t * 0.4),
                    lerp(NAVY[2], 36, t * 0.4),
                    255,
                )
            # moon
            moon_r = r * 0.42
            moon_cx, moon_cy = cx - r * 0.08, cy - r * 0.12
            if circle(x, y, moon_cx, moon_cy, moon_r):
                color = CREAM
            cut_r = moon_r * 0.78
            if circle(x, y, moon_cx + moon_r * 0.42, moon_cy - moon_r * 0.18, cut_r):
                color = (
                    lerp(NAVY[0], 22, 0.2),
                    lerp(NAVY[1], 42, 0.2),
                    lerp(NAVY[2], 36, 0.2),
                    255,
                )
            # berry
            bx, by = cx + r * 0.28, cy + r * 0.32
            br = r * 0.28
            if circle(x, y, bx, by, br):
                color = PINK
            if circle(x, y, bx - br * 0.25, by - br * 0.25, br * 0.28):
                color = blend(color, (255, 190, 170, 180))
            # mint leaf / stem
            stem_x, stem_y = bx, by - br
            if abs(x - stem_x) < size * 0.012 and stem_y - size * 0.06 < y < stem_y + size * 0.02:
                color = MINT
            if circle(x, y, stem_x + br * 0.35, stem_y - br * 0.15, br * 0.22):
                color = MINT
            # gold spark
            if circle(x, y, cx - r * 0.46, cy + r * 0.38, r * 0.07):
                color = GOLD
            pixels.append(color)
    return pixels


def write(name: str, size: int, maskable: bool = False) -> None:
    data = png(size, size, paint_icon(size, maskable))
    path = OUT / name
    path.write_bytes(data)
    print(f"wrote {path} ({len(data)} bytes)")


if __name__ == "__main__":
    write("icon-192.png", 192)
    write("icon-512.png", 512)
    write("icon-maskable-192.png", 192, True)
    write("icon-maskable-512.png", 512, True)
    write("apple-touch-icon.png", 180)
    write("favicon-32.png", 32)
    (OUT / "mask-icon.svg").write_text(
        """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<circle cx="16" cy="16" r="12" fill="#7dcea0"/>
</svg>
"""
    )
    print("icons ready")
