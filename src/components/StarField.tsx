import { useEffect, useRef } from 'react';

export type StarFieldVariant = 'default' | 'eve' | 'nye';

type Props = {
  reducedMotion: boolean;
  variant: StarFieldVariant;
  /** Pause while something else (the intro) is animating on top. */
  paused?: boolean;
};

type Star = {
  x: number;
  y: number;
  r: number;
  alpha: number;
  speed: number;
  phase: number;
  drift: number;
  color: string;
};

type Shooting = { x: number; y: number; vx: number; vy: number; life: number };

const FRAME_MS = 1000 / 30;

/**
 * A single fixed canvas behind the page: faint twinkling stars with slow drift and a very
 * occasional shooting star. Capped star count, 30 fps, paused when the tab is hidden, and a
 * single still frame when the visitor prefers reduced motion.
 */
export function StarField({ reducedMotion, variant, paused = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let shooting: Shooting | null = null;
    let nextShootingAt = performance.now() + 9000 + Math.random() * 12000;
    const warmShare = variant === 'nye' ? 0.24 : variant === 'eve' ? 0.16 : 0.07;

    const build = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(variant === 'nye' ? 300 : 240, Math.max(70, (width * height) / 7000)));
      stars = Array.from({ length: count }, () => {
        const near = Math.random();
        const warm = Math.random() < warmShare;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.35 + near * near * 1.25,
          alpha: 0.25 + Math.random() * 0.6,
          speed: 0.4 + Math.random() * 1.4,
          phase: Math.random() * Math.PI * 2,
          drift: 0.002 + near * 0.006,
          color: warm ? '244, 213, 139' : near > 0.8 ? '247, 243, 234' : '200, 214, 255',
        };
      });
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const star of stars) {
        const twinkle = reducedMotion ? 1 : 0.6 + 0.4 * Math.sin(time * 0.001 * star.speed + star.phase);
        if (!reducedMotion) {
          star.x -= star.drift;
          if (star.x < -2) star.x = width + 2;
        }
        ctx.globalAlpha = star.alpha * twinkle;
        ctx.fillStyle = `rgb(${star.color})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reducedMotion) {
        if (!shooting && time > nextShootingAt) {
          const fromLeft = Math.random() < 0.5;
          shooting = {
            x: fromLeft ? Math.random() * width * 0.5 : width * (0.5 + Math.random() * 0.5),
            y: Math.random() * height * 0.35,
            vx: (fromLeft ? 1 : -1) * (5 + Math.random() * 3),
            vy: 2 + Math.random() * 1.5,
            life: 1,
          };
          nextShootingAt = time + (variant === 'nye' ? 9000 : 16000) + Math.random() * 14000;
        }
        if (shooting) {
          const tail = 14;
          const gradient = ctx.createLinearGradient(
            shooting.x,
            shooting.y,
            shooting.x - shooting.vx * tail,
            shooting.y - shooting.vy * tail,
          );
          gradient.addColorStop(0, `rgba(255, 244, 220, ${0.75 * shooting.life})`);
          gradient.addColorStop(1, 'rgba(255, 244, 220, 0)');
          ctx.globalAlpha = 1;
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(shooting.x, shooting.y);
          ctx.lineTo(shooting.x - shooting.vx * tail, shooting.y - shooting.vy * tail);
          ctx.stroke();
          shooting.x += shooting.vx;
          shooting.y += shooting.vy;
          shooting.life -= 0.022;
          if (shooting.life <= 0) shooting = null;
        }
      }
      ctx.globalAlpha = 1;
    };

    build();
    draw(performance.now());

    let frame = 0;
    let last = 0;
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (now - last < FRAME_MS) return;
      last = now;
      draw(now);
    };
    const start = () => {
      if (reducedMotion || paused || document.hidden || frame) return;
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    const onResize = () => {
      build();
      draw(performance.now());
    };

    start();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
    };
  }, [reducedMotion, variant, paused]);

  return <canvas ref={canvasRef} className="star-field" aria-hidden="true" />;
}
