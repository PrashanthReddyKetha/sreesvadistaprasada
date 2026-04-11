import React, { useState } from 'react';

// Loads the real logo from /logo.png when the file is placed in frontend/public/.
// Until then renders a faithful SVG recreation:
//   — landscape oval ring (the distinctive frame)
//   — "sP" serif monogram (lowercase s + large P, as in the actual logo)
//   — lotus crown at the top-left overlapping the oval
const LogoMark = ({ size = 46 }) => {
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

  return (
    <svg
      width={size}
      height={Math.round(size * 1.18)}
      viewBox="0 0 52 62"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Sree Svadista Prasada logo"
      style={{ flexShrink: 0 }}
    >
      {/*
        ── LOTUS (upper-left, overlapping the top of the oval) ──
        Pivot point for petal rotations: (19, 22)
        Each petal: tall ellipse (rx 3, ry 8) sitting 7px above the pivot
      */}
      {/* Back/outer petals — slightly wider, more transparent */}
      <ellipse cx="19" cy="14" rx="3.8" ry="8.5" fill="#F4C430" fillOpacity="0.45" transform="rotate(-35 19 22)" />
      <ellipse cx="19" cy="14" rx="3.8" ry="8.5" fill="#F4C430" fillOpacity="0.45" transform="rotate(35 19 22)" />
      {/* Mid petals */}
      <ellipse cx="19" cy="14" rx="3.2" ry="8"   fill="#F4C430" fillOpacity="0.65" transform="rotate(-18 19 22)" />
      <ellipse cx="19" cy="14" rx="3.2" ry="8"   fill="#F4C430" fillOpacity="0.65" transform="rotate(18 19 22)" />
      {/* Centre petal — full gold */}
      <ellipse cx="19" cy="14" rx="3"   ry="8.5" fill="#F4C430" />
      {/* Lotus centre bud */}
      <circle cx="19" cy="22" r="2.2" fill="#800020" />

      {/*
        ── OVAL FRAME ──
        Landscape ellipse, sits below the lotus
        Two rings (outer + inner subtle) just like the actual logo
      */}
      <ellipse cx="29" cy="42" rx="22" ry="17" stroke="#800020" strokeWidth="2"   fill="none" />
      <ellipse cx="29" cy="42" rx="17" ry="13" stroke="#800020" strokeWidth="0.6" fill="none" strokeOpacity="0.25" />

      {/*
        ── sP MONOGRAM ──
        Lowercase 's' on the left (smaller), uppercase 'P' large on the right
        Matching the character size relationship in the actual logo
      */}
      <text
        x="14"
        y="50"
        fontFamily="'Playfair Display', Georgia, 'Times New Roman', serif"
        fontSize="14"
        fontWeight="700"
        fill="#800020"
      >s</text>
      <text
        x="23"
        y="54"
        fontFamily="'Playfair Display', Georgia, 'Times New Roman', serif"
        fontSize="26"
        fontWeight="700"
        fill="#800020"
      >P</text>
    </svg>
  );
};

export default LogoMark;
