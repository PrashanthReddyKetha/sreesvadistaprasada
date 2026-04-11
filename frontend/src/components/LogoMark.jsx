import React, { useState } from 'react';

// Loads the real logo (background-removed PNG) from /logo.png.
// Falls back to the SVG mark if the file is missing.
const LogoMark = ({ size = 64, className = '' }) => {
  const [error, setError] = useState(false);

  if (!error) {
    return (
      <img
        src="/logo.png"
        alt="Sree Svadista Prasada"
        onError={() => setError(true)}
        className={className || undefined}
        style={className ? { objectFit: 'contain', flexShrink: 0 } : {
          width: size, height: size, objectFit: 'contain', flexShrink: 0,
        }}
      />
    );
  }

  // SVG fallback — SP oval + lotus
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
      <ellipse cx="19" cy="14" rx="3.8" ry="8.5" fill="#F4C430" fillOpacity="0.45" transform="rotate(-35 19 22)" />
      <ellipse cx="19" cy="14" rx="3.8" ry="8.5" fill="#F4C430" fillOpacity="0.45" transform="rotate(35 19 22)" />
      <ellipse cx="19" cy="14" rx="3.2" ry="8"   fill="#F4C430" fillOpacity="0.65" transform="rotate(-18 19 22)" />
      <ellipse cx="19" cy="14" rx="3.2" ry="8"   fill="#F4C430" fillOpacity="0.65" transform="rotate(18 19 22)" />
      <ellipse cx="19" cy="14" rx="3"   ry="8.5" fill="#F4C430" />
      <circle  cx="19" cy="22" r="2.2" fill="#800020" />
      <ellipse cx="29" cy="42" rx="22" ry="17" stroke="#800020" strokeWidth="2"   fill="none" />
      <ellipse cx="29" cy="42" rx="17" ry="13" stroke="#800020" strokeWidth="0.6" fill="none" strokeOpacity="0.25" />
      <text x="14" y="50" fontFamily="'Playfair Display',Georgia,serif" fontSize="14" fontWeight="700" fill="#800020">s</text>
      <text x="23" y="54" fontFamily="'Playfair Display',Georgia,serif" fontSize="26" fontWeight="700" fill="#800020">P</text>
    </svg>
  );
};

export default LogoMark;
