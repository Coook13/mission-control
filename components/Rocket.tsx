/* A clean, detailed vector rocket — metallic body, glass porthole, fins,
   animated flame. Crisp at any size. */
export function Rocket({ className = "" }: { className?: string }) {
  return (
    <svg className={`rocket ${className}`} viewBox="0 0 160 392" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="rkBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6c707a" />
          <stop offset="0.33" stopColor="#f2f4f8" />
          <stop offset="0.56" stopColor="#dadde4" />
          <stop offset="1" stopColor="#585c66" />
        </linearGradient>
        <linearGradient id="rkNose" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7c241c" />
          <stop offset="0.42" stopColor="#ec5a4e" />
          <stop offset="1" stopColor="#591a14" />
        </linearGradient>
        <linearGradient id="rkFin" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a52e23" />
          <stop offset="1" stopColor="#5f1a13" />
        </linearGradient>
        <radialGradient id="rkWin" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#cdecff" />
          <stop offset="0.5" stopColor="#3f8fd6" />
          <stop offset="1" stopColor="#11324f" />
        </radialGradient>
        <radialGradient id="rkFlame" cx="0.5" cy="0.12" r="0.95">
          <stop offset="0" stopColor="#fff7d6" />
          <stop offset="0.34" stopColor="#ffd24a" />
          <stop offset="0.72" stopColor="#ff7a1c" />
          <stop offset="1" stopColor="#ff7a1c" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g className="rocket__flame">
        <path d="M62 300 Q80 398 98 300 Q80 332 62 300 Z" fill="url(#rkFlame)" />
        <path d="M70 300 Q80 360 90 300 Q80 322 70 300 Z" fill="#fff7d6" opacity="0.92" />
      </g>

      <path d="M58 252 L24 322 L58 302 Z" fill="url(#rkFin)" />
      <path d="M102 252 L136 322 L102 302 Z" fill="url(#rkFin)" />
      <path d="M66 296 L94 296 L88 314 L72 314 Z" fill="#383b43" />

      <path d="M58 96 Q58 92 62 92 L98 92 Q102 92 102 96 L102 300 L58 300 Z" fill="url(#rkBody)" />
      <rect x="56" y="298" width="48" height="7" rx="3" fill="#474a52" />

      <path d="M80 16 Q102 58 102 96 L58 96 Q58 58 80 16 Z" fill="url(#rkNose)" />
      <circle cx="80" cy="20" r="3.6" fill="#ffd24a" />

      <circle cx="80" cy="142" r="17" fill="#19293a" />
      <circle cx="80" cy="142" r="13" fill="url(#rkWin)" />
      <circle cx="75" cy="137" r="3.4" fill="#eaf6ff" opacity="0.85" />

      <line x1="58" y1="184" x2="102" y2="184" stroke="#9aa0ab" strokeWidth="1.2" opacity="0.45" />
      <line x1="58" y1="244" x2="102" y2="244" stroke="#9aa0ab" strokeWidth="1.2" opacity="0.45" />
      <rect x="73" y="206" width="14" height="22" rx="2.5" fill="#c2c6cf" opacity="0.55" />
    </svg>
  );
}
