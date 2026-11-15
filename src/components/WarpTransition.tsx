import { useEffect, useRef } from 'react';

interface WarpTransitionProps {
  title: string;
  subtitle: string;
  accentColor?: string;
  durationMs?: number;
  onMidpoint?: () => void;
  onComplete: () => void;
}

interface WarpStreak {
  angle: number;
  dist: number;
  speed: number;
  len: number;
  thickness: number;
  color: string;
}

const WARP_COLORS = ['#34d399', '#38bdf8', '#facc15', '#ffffff', '#2dd4bf'];

export function WarpTransition({
  title,
  subtitle,
  accentColor = '#34d399',
  durationMs = 1350,
  onMidpoint,
  onComplete,
}: WarpTransitionProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onMidpointRef = useRef(onMidpoint);
  const onCompleteRef = useRef(onComplete);
  onMidpointRef.current = onMidpoint;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      const midTimer = window.setTimeout(() => onMidpointRef.current?.(), 180);
      const endTimer = window.setTimeout(() => onCompleteRef.current(), 480);
      return () => {
        clearTimeout(midTimer);
        clearTimeout(endTimer);
      };
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const streaks: WarpStreak[] = Array.from({ length: 190 }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: 14 + Math.random() * 140,
      speed: 0.7 + Math.random() * 1.4,
      len: 10 + Math.random() * 26,
      thickness: 1.2 + Math.random() * 2.4,
      color: WARP_COLORS[Math.floor(Math.random() * WARP_COLORS.length)],
    }));

    const startTime = performance.now();
    let midFired = false;
    let rafId = 0;

    const renderFrame = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);

      if (!midFired && t >= 0.5) {
        midFired = true;
        onMidpointRef.current?.();
      }

      // Clear with deep cyber-space veil for smooth streak trails
      ctx.fillStyle = 'rgba(2, 6, 23, 0.34)';
      ctx.fillRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.5;
      const maxRadius = Math.hypot(cx, cy) * 1.15;

      // Warp speed envelope: builds quickly, peaks in middle, decelerates cleanly
      const velocityBoost = Math.sin(t * Math.PI) * 34 + 6;

      // Radial portal rings expanding from center
      for (let r = 0; r < 3; r++) {
        const ringPhase = (t * 2.4 + r * 0.33) % 1;
        const radius = ringPhase * maxRadius * 0.85;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = r === 1 ? '#facc15' : accentColor;
        ctx.globalAlpha = (1 - ringPhase) * 0.35;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Hyper-speed radial light streaks
      for (const s of streaks) {
        s.dist += s.speed * velocityBoost;
        if (s.dist > maxRadius) {
          s.dist = 12 + Math.random() * 35;
          s.angle = Math.random() * Math.PI * 2;
        }

        const tail = Math.max(8, s.dist - s.len * (velocityBoost * 0.28));
        const x1 = cx + Math.cos(s.angle) * tail;
        const y1 = cy + Math.sin(s.angle) * tail;
        const x2 = cx + Math.cos(s.angle) * s.dist;
        const y2 = cy + Math.sin(s.angle) * s.dist;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.thickness;
        ctx.lineCap = 'round';
        ctx.globalAlpha = Math.min(1, 0.4 + t * 0.6);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Peak flash burst right around teleport arrival (t = 0.45..0.75)
      if (t > 0.42 && t < 0.78) {
        const flashAlpha = Math.sin(((t - 0.42) / 0.36) * Math.PI) * 0.48;
        const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, maxRadius * 0.75);
        grad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
        grad.addColorStop(0.35, `rgba(52, 211, 153, ${flashAlpha * 0.65})`);
        grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      if (t < 1) {
        rafId = requestAnimationFrame(renderFrame);
      } else {
        onCompleteRef.current();
      }
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [accentColor, durationMs]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/95 pointer-events-auto select-none"
      role="status"
      aria-live="polite"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Center Portal HUD */}
      <div className="relative z-10 max-w-xl w-[90vw] mx-auto px-6 py-7 rounded-3xl bg-slate-950/88 border-2 border-emerald-400/80 shadow-2xl text-center space-y-3">
        <div className="font-game text-xs sm:text-sm font-black tracking-[0.26em] text-sky-300 uppercase">
          ⚡ TELEPORTASI WARP ECOWORLD
        </div>
        <h2 className="game-title-gold text-2xl sm:text-4xl font-black tracking-wide uppercase leading-tight">
          {title}
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-emerald-200 tracking-wide">
          {subtitle}
        </p>

        {/* Warp Energy Bar */}
        <div className="w-60 h-2 mx-auto rounded-full bg-slate-800 overflow-hidden border border-emerald-400/40 mt-2">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-400"
            style={{
              animation: `warpCharge ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes warpCharge {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
