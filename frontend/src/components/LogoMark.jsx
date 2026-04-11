import React, { useState } from 'react';

// Loads the real logo from /logo.png (place file in frontend/public/logo.png).
// Shows nothing if the file isn't found yet.
const LogoMark = ({ size = 48 }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) return null;

  return (
    <img
      src="/logo.png"
      alt="Sree Svadista Prasada logo"
      width={size}
      height={size}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        // removes the warm logo background so it sits cleanly on the cream header
        mixBlendMode: 'multiply',
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.3s',
        flexShrink: 0,
      }}
    />
  );
};

export default LogoMark;
