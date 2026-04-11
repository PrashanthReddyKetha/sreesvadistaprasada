import React from 'react';

// Decorative South Indian emblem: a stylised lotus inside a circle, in maroon + gold
const LogoMark = ({ size = 44 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Outer ring */}
    <circle cx="22" cy="22" r="21" stroke="#F4C430" strokeWidth="1.5" />
    {/* Inner background disc */}
    <circle cx="22" cy="22" r="19" fill="#800020" />
    {/* Lotus petals — 8 petals using ellipses rotated around centre */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
      <ellipse
        key={deg}
        cx="22"
        cy="22"
        rx="3"
        ry="8"
        fill="#F4C430"
        fillOpacity="0.75"
        transform={`rotate(${deg} 22 22) translate(0 -6)`}
      />
    ))}
    {/* Centre dot */}
    <circle cx="22" cy="22" r="3.5" fill="#F4C430" />
    {/* Gold thin ring inside outer */}
    <circle cx="22" cy="22" r="13" stroke="#F4C430" strokeWidth="0.6" strokeOpacity="0.5" />
  </svg>
);

export default LogoMark;
