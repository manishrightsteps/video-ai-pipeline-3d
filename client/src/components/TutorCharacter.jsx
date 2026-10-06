import { useEffect, useRef } from 'react';

const LOOKS = {
  oliver: { hair: '#5b3a1e', skin: '#f2c9a0', top: '#2563eb', glasses: true },
  alice: { hair: '#b45309', skin: '#f5d0b0', top: '#db2777', glasses: false },
};

/**
 * Simple SVG tutor. The mouth opens with the agent's live output volume —
 * updated straight on the DOM every frame so React doesn't re-render 60×/s.
 */
export default function TutorCharacter({ tutorId, getVolume, isSpeaking, isLive }) {
  const mouthRef = useRef(null);
  const look = LOOKS[tutorId] ?? LOOKS.oliver;

  useEffect(() => {
    let frame;
    let smoothed = 0;
    const tick = () => {
      const target = isLive ? Math.min(1, (getVolume?.() ?? 0) * 3) : 0;
      smoothed += (target - smoothed) * 0.35;
      mouthRef.current?.setAttribute('ry', String(2 + smoothed * 14));
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [getVolume, isLive]);

  return (
    <div className="relative mx-auto w-56 sm:w-64">
      <div
        className={`absolute inset-0 rounded-full blur-2xl transition-opacity duration-500 ${
          isSpeaking ? 'bg-sky-300/60 opacity-100' : 'opacity-0'
        }`}
      />
      <svg viewBox="0 0 200 220" className="bob relative w-full drop-shadow-lg" aria-label="Tutor character">
        {/* shoulders */}
        <path d="M30 220 C30 170 60 155 100 155 C140 155 170 170 170 220 Z" fill={look.top} />
        <rect x="88" y="135" width="24" height="26" rx="8" fill={look.skin} />
        {/* hair back */}
        {tutorId === 'alice' && <ellipse cx="100" cy="95" rx="66" ry="72" fill={look.hair} />}
        {/* face */}
        <ellipse cx="100" cy="88" rx="52" ry="58" fill={look.skin} />
        {/* hair top */}
        <path d="M48 78 C48 35 80 22 102 22 C130 22 154 40 152 78 C140 58 120 50 100 52 C78 54 60 60 48 78 Z" fill={look.hair} />
        {/* eyes */}
        <ellipse className="eye" cx="80" cy="88" rx="5" ry="6" fill="#1e293b" />
        <ellipse className="eye" cx="120" cy="88" rx="5" ry="6" fill="#1e293b" />
        {look.glasses && (
          <g fill="none" stroke="#334155" strokeWidth="3">
            <circle cx="80" cy="88" r="14" />
            <circle cx="120" cy="88" r="14" />
            <path d="M94 88 h12" />
          </g>
        )}
        {/* cheeks */}
        <circle cx="68" cy="110" r="7" fill="#fb7185" opacity="0.25" />
        <circle cx="132" cy="110" r="7" fill="#fb7185" opacity="0.25" />
        {/* mouth */}
        <ellipse ref={mouthRef} cx="100" cy="118" rx="12" ry="2" fill="#7f1d1d" />
      </svg>
    </div>
  );
}
