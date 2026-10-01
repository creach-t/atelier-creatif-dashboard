import React, { useId } from 'react';

// Logo de l'application : barres de ventes croissantes et une étincelle sur fond dégradé — un symbole, sans lettre ni nom,
// pour qu'il survive à un changement de nom. Même dessin que public/favicon.svg.
export const BrandMark = ({ size = 40, className = '' }) => {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label="Logo">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${gradientId})`} />
      <rect x="15" y="38" width="9" height="12" rx="4.5" fill="#fff"/>
      <rect x="27" y="30" width="9" height="20" rx="4.5" fill="#fff"/>
      <rect x="39" y="22" width="9" height="28" rx="4.5" fill="#fff"/>
      <path d="M50 7.5l1.4 4.1 4.1 1.4-4.1 1.4L50 18.5l-1.4-4.1-4.1-1.4 4.1-1.4z" fill="#fff"/>
    </svg>
  );
};
