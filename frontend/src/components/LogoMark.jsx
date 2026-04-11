import React, { useState } from 'react';

// Tries to load the real logo from /logo.png.
// Falls back to an SVG emblem that mirrors the brand (SP oval + lotus).
const LogoMark = ({ size = 48 }) => {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <img
        src="/logo.png"
        alt="Sree Svadista Prasada logo"
        width={size}
        height={size}
        onError={() => setImgError(true)}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          // blend warm logo background seamlessly with the cream header (#FDFBF7)
          mixBlendMode: 'multiply',
          borderRadius: 2,
        }}
      />
    );
  }

  // ── SVG fallback — SP monogram inside an oval with a lotus crown ──
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Oval frame */}
      <ellipse cx="24" cy="30" rx="22" ry="20" stroke="#800020" strokeWidth="1.8" fill="none" />
      <ellipse cx="24" cy="30" rx="18" ry="16" stroke="#F4C430" strokeWidth="0.7" strokeOpacity="0.5" fill="none" />

      {/* S glyph */}
      <text
        x="10"
        y="38"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="18"
        fontWeight="700"
        fill="#800020"
        letterSpacing="-1"
      >
        SP
      </text>

      {/* Lotus petals at the top */}
      {[-12, -6, 0, 6, 12].map((dx, i) => (
        <ellipse
          key={i}
          cx={24 + dx}
          cy={10 - Math.abs(dx) * 0.15}
          rx="3.2"
          ry="5"
          fill="#F4C430"
          fillOpacity={i === 2 ? 0.95 : 0.65}
          transform={`rotate(${dx * 3} ${24 + dx} 14)`}
        />
      ))}
      {/* Lotus centre */}
      <circle cx="24" cy="9" r="2.2" fill="#800020" />
    </svg>
  );
};

export default LogoMark;
