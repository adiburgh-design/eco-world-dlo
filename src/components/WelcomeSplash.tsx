import { useState } from 'react';
import { playSFX } from '../utils/sound';

interface WelcomeSplashProps {
  onStart: () => void;
}

export function WelcomeSplash({ onStart }: WelcomeSplashProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="fixed inset-0 z-30 bg-[#02121f] flex items-center justify-center overflow-hidden select-none">
      {/* Strict static 16:9 landscape frame so the in-image MULA button aligns accurately on all screens */}
      <div className="relative w-[min(100vw,177.78vh)] h-[min(100vh,56.25vw)]">
        {!imgError ? (
          <>
            <img
              src="/assets/aistudio/image_7a6cfa98.png"
              alt="EcoWorld Mission Control: Suara Generasi Prihatin"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-fill block"
              draggable={false}
            />
            {/* Transparent clickable hotspot aligned directly on the MULA button inside the image */}
            <button
              type="button"
              onClick={() => {
                playSFX('portal');
                onStart();
              }}
              aria-label="Mula Permainan EcoWorld"
              title="Tekan MULA untuk memulakan misi"
              className="absolute left-[31%] top-[76.5%] w-[38%] h-[17%] rounded-full cursor-pointer bg-transparent hover:bg-emerald-400/15 hover:ring-4 hover:ring-emerald-300/65 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-950 via-emerald-950 to-sky-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <h1 className="game-title-emerald text-4xl sm:text-6xl font-black uppercase">
              ECO WORLD
            </h1>
            <p className="game-subtitle-neon text-xl sm:text-2xl font-bold text-emerald-300 uppercase tracking-widest">
              MISSION CONTROL · SUARA GENERASI PRIHATIN
            </p>
            <button
              type="button"
              onClick={() => {
                playSFX('portal');
                onStart();
              }}
              className="btn-game-emerald font-game px-12 py-3.5 rounded-full text-slate-950 text-2xl font-black tracking-widest uppercase cursor-pointer"
            >
              MULA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
