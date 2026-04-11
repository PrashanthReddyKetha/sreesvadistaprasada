import React, { useState } from 'react';

// Tries to load the real logo from /logo.png first.
// Falls back to an SVG that mirrors the brand mark:
// a thin oval frame with "SP" serif monogram and a lotus crown.
const LogoMark = ({ size = 48 }) => {
  const [error, setError] = useState(false);

  if (!error) {
    return (
      <img
        src="/logo.png"
        alt="Sree Svadista Prasada"
        width={size}
        height={size}
        onError={() => setError(true)}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          mixBlendMode: 'multiply',
          flexShrink: 0,
        }}
      />
    );
  }

  // SVG fallback — SP in oval with lotus, matching brand colours
  const h = Math.round(size * 1.1);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 48 54"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Sree Svadista Prasada"
      style={{ flexShrink: 0 }}
    >
      {/* ── Lotus crown ── */}
      {/* outer petals */}
      <ellipse cx="24" cy="9"  rx="3.5" ry="6.5" fill="#F4C430" fillOpacity="0.55" transform="rotate(-20 24 9)" />
      <ellipse cx="24" cy="9"  rx="3.5" ry="6.5" fill="#F4C430" fillOpacity="0.55" transform="rotate(20 24 9)" />
      {/* inner petals */}
      <ellipse cx="24" cy="8"  rx="2.8" ry="6"   fill="#F4C430" fillOpacity="0.75" transform="rotate(-8 24 8)" />
      <ellipse cx="24" cy="8"  rx="2.8" ry="6"   fill="#F4C430" fillOpacity="0.75" transform="rotate(8 24 8)" />
      {/* centre petal */}
      <ellipse cx="24" cy="7"  rx="2.4" ry="5.5" fill="#F4C430" />
      {/* lotus base dot */}
      <circle  cx="24" cy="13" r="2"    fill="#800020" />

      {/* ── Oval frame ── */}
      <ellipse cx="24" cy="35" rx="22" ry="18" stroke="#800020" strokeWidth="1.6" fill="none" />

      {/* ── SP monogram ── */}
      <text
        x="24"
        y="42"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="20"
        fontWeight="700"
        fill="#800020"
        letterSpacing="1"
      >
        SP
      </text>
    </svg>
  );
};

export default LogoMark;
