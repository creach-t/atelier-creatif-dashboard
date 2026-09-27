import React from 'react';

// `image` est soit un emoji (produit créé à la main), soit une vraie URL de photo
// (récupérée depuis la boutique Ko-fi) — on affiche l'un ou l'autre selon le cas.
export const ProductThumbnail = ({ image, size = 'text-4xl', className = '' }) => {
  const isUrl = typeof image === 'string' && image.startsWith('http');

  if (isUrl) {
    return (
      <img
        src={image}
        alt=""
        className={`w-16 h-16 rounded-xl object-cover mx-auto ${className}`}
      />
    );
  }

  return <div className={`${size} ${className}`}>{image}</div>;
};
