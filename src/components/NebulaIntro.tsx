import { useEffect, useRef, useState } from 'react';

type Props = {
  reducedMotion: boolean;
  onDone: () => void;
};

/** How long the nebula holds with the title before the opening starts (ms). */
const HOLD_MS = 2300;
/** The opening: rotate, open the centre, expand, fade (ms). */
const TRANSITION_MS = 3000;
/** Reduced motion: a still frame, then a short fade. */
const REDUCED_HOLD_MS = 1400;
const REDUCED_FADE_MS = 500;

type IntroStar = {
  angle: number;
  radius: number;
  size: number;
  alpha: number;
  depth: number;
  warm: boolean;
};

function createRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Paints the nebula once into an offscreen canvas: soft additive gas clouds along two loose
 * spiral arms, a warm core and darker dust. Each animation frame then only rotates/scales this
 * texture, which keeps the intro cheap even on phones.
 */
function paintNebulaTexture(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const random = createRandom(2026);
  const c = size / 2;
  const palette = [
    [91, 67, 199],
    [128, 103, 255],
    [72, 52, 168],
    [114, 223, 255],
    [60, 90, 200],
    [158, 92, 220],
  ];

  ctx.globalCompositeOperation = 'lighter';
  for (let arm = 0; arm < 2; arm += 1) {
    for (let i = 0; i < 46; i += 1) {
      const t = i / 46;
      const angle = arm * Math.PI + t * Math.PI * 2.4 + (random() - 0.5) * 0.5;
      const distance = size * (0.04 + t * 0.4) * (0.85 + random() * 0.3);
      const x = c + Math.cos(angle) * distance;
      const y = c + Math.sin(angle) * distance * 0.82;
      const radius = size * (0.07 + random() * 0.11) * (1 - t * 0.35);
      const [r, g, b] = palette[Math.floor(random() * palette.length)];
      const alpha = 0.05 + random() * 0.07;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
      gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
  }

  // Broad violet haze so the arms read as one cloud.
  const haze = ctx.createRadialGradient(c, c, 0, c, c, size * 0.5);
  haze.addColorStop(0, 'rgba(110,80,220,0.22)');
  haze.addColorStop(0.55, 'rgba(60,40,150,0.08)');
  haze.addColorStop(1, 'rgba(20,20,60,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, size, size);

  // Soft glowing centre with a hint of gold.
  const core = ctx.createRadialGradient(c, c, 0, c, c, size * 0.16);
  core.addColorStop(0, 'rgba(255,244,220,0.85)');
  core.addColorStop(0.25, 'rgba(244,213,139,0.35)');
  core.addColorStop(0.6, 'rgba(150,120,255,0.12)');
  core.addColorStop(1, 'rgba(150,120,255,0)');
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, size, size);

  // Dark dust lanes for depth.
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 18; i += 1) {
    const angle = random() * Math.PI * 2;
    const distance = size * (0.12 + random() * 0.3);
    const x = c + Math.cos(angle) * distance;
    const y = c + Math.sin(angle) * distance * 0.82;
    const radius = size * (0.04 + random() * 0.07);
    const dust = ctx.createRadialGradient(x, y, 0, x, y, radius);
    dust.addColorStop(0, 'rgba(7,9,24,0.32)');
    dust.addColorStop(1, 'rgba(7,9,24,0)');
    ctx.fillStyle = dust;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  return canvas;
}

function createStars(count: number): IntroStar[] {
  const random = createRandom(1224);
  return Array.from({ length: count }, () => {
    const depth = random();
    return {
      angle: random() * Math.PI * 2,
      radius: Math.pow(random(), 0.75),
      size: 0.4 + depth * 1.4,
      alpha: 0.35 + random() * 0.65,
      depth,
      warm: random() < 0.07,
    };
  });
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeIn = (t: number) => t * t;

export function NebulaIntro({ reducedMotion, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onDoneRef = useRef(onDone);
  const [stage, setStage] = useState<'hold' | 'opening' | 'fading'>('hold');

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d') ?? null;
    let frame = 0;
    let start = 0;
    let finished = false;
    const timers: number[] = [];
    const finish = () => {
      if (finished) return;
      finished = true;
      onDoneRef.current();
    };

    // Without canvas support the title still shows and the same timeline runs.
    if (!canvas || !ctx) {
      const total = reducedMotion ? REDUCED_HOLD_MS + REDUCED_FADE_MS : HOLD_MS + TRANSITION_MS;
      timers.push(
        window.setTimeout(
          () => setStage(reducedMotion ? 'fading' : 'opening'),
          reducedMotion ? REDUCED_HOLD_MS : HOLD_MS,
        ),
      );
      timers.push(window.setTimeout(finish, total));
      return () => timers.forEach((timer) => window.clearTimeout(timer));
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const isSmall = Math.min(window.innerWidth, window.innerHeight) < 600;
    const texture = paintNebulaTexture(isSmall ? 768 : 1024);
    const stars = createStars(isSmall ? 220 : 380);
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointer = (event: PointerEvent) => {
      pointer.tx = (event.clientX / width - 0.5) * 2;
      pointer.ty = (event.clientY / height - 0.5) * 2;
    };
    if (!reducedMotion) window.addEventListener('pointermove', onPointer, { passive: true });

    const draw = (elapsed: number) => {
      const progress = reducedMotion ? 0 : Math.min(1, Math.max(0, (elapsed - HOLD_MS) / TRANSITION_MS));
      const eased = easeInOut(progress);
      const rotation = reducedMotion ? 0.35 : 0.35 + elapsed * 0.000035 + easeIn(progress) * 0.35;
      const scale = 1 + eased * 2.6;
      const cx = width / 2;
      const cy = height / 2;
      const base = Math.max(width, height) * 1.05;
      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = `rgba(7, 9, 24, ${1 - eased})`;
      ctx.fillRect(0, 0, width, height);

      // Nebula texture.
      ctx.save();
      ctx.globalAlpha = 1 - eased * 0.92;
      ctx.translate(cx + pointer.x * 10, cy + pointer.y * 8);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);
      ctx.drawImage(texture, -base / 2, -base / 2, base, base);
      ctx.restore();

      // Stars at several depths; deeper stars move less, near stars stream outward.
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const star of stars) {
        const parallax = 6 + star.depth * 22;
        const spread = 1 + (scale - 1) * (0.4 + star.depth * 1.2);
        const angle = star.angle + rotation * (0.5 + star.depth * 0.6);
        const r = star.radius * base * 0.62 * spread;
        const x = cx + Math.cos(angle) * r + pointer.x * parallax;
        const y = cy + Math.sin(angle) * r * 0.86 + pointer.y * parallax;
        if (x < -10 || y < -10 || x > width + 10 || y > height + 10) continue;
        const twinkle = reducedMotion ? 1 : 0.75 + 0.25 * Math.sin(elapsed * 0.002 + star.angle * 9);
        ctx.globalAlpha = star.alpha * twinkle * (1 - eased * 0.85);
        ctx.fillStyle = star.warm ? '#f4d58b' : star.depth > 0.75 ? '#ffffff' : '#cfd8ff';
        const size = star.size * (1 + eased * star.depth * 1.5);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // The centre opens: cut a growing soft hole so the interface shows through.
      if (progress > 0) {
        const holeRadius = easeIn(progress) * Math.hypot(width, height) * 0.75;
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        const hole = ctx.createRadialGradient(cx, cy, holeRadius * 0.35, cx, cy, holeRadius + 1);
        hole.addColorStop(0, 'rgba(0,0,0,1)');
        hole.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = hole;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    };

    if (reducedMotion) {
      draw(0);
      timers.push(window.setTimeout(() => setStage('fading'), REDUCED_HOLD_MS));
      timers.push(window.setTimeout(finish, REDUCED_HOLD_MS + REDUCED_FADE_MS));
    } else {
      timers.push(window.setTimeout(() => setStage('opening'), HOLD_MS));
      const loop = (now: number) => {
        if (!start) start = now;
        const elapsed = now - start;
        draw(elapsed);
        if (elapsed >= HOLD_MS + TRANSITION_MS) {
          finish();
          return;
        }
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
    };
  }, [reducedMotion]);

  return (
    <div
      className={`nebula-intro is-${stage}${reducedMotion ? ' is-reduced' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
      aria-describedby="intro-subtitle"
    >
      <canvas ref={canvasRef} className="nebula-canvas" aria-hidden="true" />
      <div className="nebula-title">
        <p id="intro-title" className="nebula-heading">
          Jólastjörnuspá
        </p>
        <p id="intro-subtitle" className="nebula-subtitle">
          Hvað segja stjörnurnar um desember hjá þér?
        </p>
      </div>
      <button type="button" className="skip-intro" onClick={() => onDoneRef.current()} autoFocus>
        Sleppa inngangi
      </button>
    </div>
  );
}
