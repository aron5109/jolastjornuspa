import type { DailyHoroscope, ZodiacSign } from '../types';
import { formatDateIs } from './dates';

const WIDTH = 1080;
const HEIGHT = 1350;
const PADDING = 96;

const DISPLAY_FONT = '"Cormorant Garamond", Georgia, serif';
const BODY_FONT = '"Inter Variable", "Inter", system-ui, sans-serif';

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

/** Renders a shareable forecast card (PNG) entirely in the browser. */
export async function renderForecastCard(sign: ZodiacSign, horoscope: DailyHoroscope): Promise<Blob | null> {
  if (document.fonts?.ready) await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  background.addColorStop(0, '#0b1030');
  background.addColorStop(0.55, '#140f3a');
  background.addColorStop(1, '#070918');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const glow = ctx.createRadialGradient(WIDTH * 0.8, HEIGHT * 0.12, 0, WIDTH * 0.8, HEIGHT * 0.12, 620);
  glow.addColorStop(0, 'rgba(128, 103, 255, 0.35)');
  glow.addColorStop(1, 'rgba(128, 103, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const random = seeded(horoscope.date.length * 97 + sign.id.length * 13 + Number(horoscope.date.slice(8)));
  for (let i = 0; i < 160; i += 1) {
    ctx.globalAlpha = 0.2 + random() * 0.6;
    ctx.fillStyle = random() < 0.12 ? '#f4d58b' : '#e6e9ff';
    ctx.beginPath();
    ctx.arc(random() * WIDTH, random() * HEIGHT, 0.6 + random() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Constellation in the top-right corner.
  const art = { x: WIDTH - PADDING - 260, y: PADDING - 10, size: 260 };
  ctx.strokeStyle = 'rgba(244, 213, 139, 0.55)';
  ctx.lineWidth = 2;
  for (const [from, to] of sign.constellation.lines) {
    const a = sign.constellation.stars[from];
    const b = sign.constellation.stars[to];
    ctx.beginPath();
    ctx.moveTo(art.x + (a.x / 100) * art.size, art.y + (a.y / 100) * art.size);
    ctx.lineTo(art.x + (b.x / 100) * art.size, art.y + (b.y / 100) * art.size);
    ctx.stroke();
  }
  ctx.fillStyle = '#fff4dc';
  for (const star of sign.constellation.stars) {
    ctx.beginPath();
    ctx.arc(
      art.x + (star.x / 100) * art.size,
      art.y + (star.y / 100) * art.size,
      2 + star.magnitude * 1.6,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  let y = PADDING + 30;
  ctx.fillStyle = '#f4d58b';
  ctx.font = `600 26px ${BODY_FONT}`;
  ctx.fillText(`JÓLASTJÖRNUSPÁ · ${formatDateIs(horoscope.date).toUpperCase()}`, PADDING, y);
  y += 110;
  ctx.fillStyle = '#f7f3ea';
  ctx.font = `600 104px ${DISPLAY_FONT}`;
  ctx.fillText(sign.name, PADDING, y);
  y += 56;
  ctx.fillStyle = 'rgba(247, 243, 234, 0.72)';
  ctx.font = `400 30px ${BODY_FONT}`;
  ctx.fillText(sign.dateRange, PADDING, y);
  y += 70;
  ctx.fillStyle = '#9fe8ff';
  ctx.font = `italic 500 44px ${DISPLAY_FONT}`;
  ctx.fillText(`„${horoscope.headline}“`, PADDING, y);
  y += 40;

  const sections: [string, string][] = [
    ['Vinnan', horoscope.work],
    ['Jólin', horoscope.christmas],
    ['Heppnin', horoscope.luck],
  ];
  for (const [title, text] of sections) {
    y += 54;
    ctx.fillStyle = '#f4d58b';
    ctx.font = `600 40px ${DISPLAY_FONT}`;
    ctx.fillText(title, PADDING, y);
    ctx.fillStyle = '#f7f3ea';
    ctx.font = `400 31px ${BODY_FONT}`;
    for (const line of wrap(ctx, text, WIDTH - PADDING * 2)) {
      y += 44;
      ctx.fillText(line, PADDING, y);
    }
    y += 12;
  }

  ctx.fillStyle = 'rgba(247, 243, 234, 0.6)';
  ctx.font = `400 24px ${BODY_FONT}`;
  ctx.fillText('Til gamans gert · aron5109.github.io/jolastjornuspa', PADDING, HEIGHT - PADDING + 20);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
