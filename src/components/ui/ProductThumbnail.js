import React from 'react';
import { ImageIcon } from 'lucide-react';

const DEFAULT_EMOJIS = ['🎨', '🎁'];

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

// Visuel "pochette" façon boutique Ko-fi : photo carrée qui remplit le haut de la carte.
// Sans photo (emoji par défaut ou vide), un placeholder doux avec une icône image ; un emoji
// choisi à la main est affiché en grand sur un fond pastel.
export const ProductCover = ({ image, className = '', rounded = 'rounded-t-2xl', aspect = 'aspect-square' }) => {
  const isUrl = typeof image === 'string' && image.startsWith('http');
  const isPlaceholder = !image || DEFAULT_EMOJIS.includes(image);

  return (
    <div className={`relative ${aspect} w-full overflow-hidden bg-gradient-to-br from-purple-100 via-purple-50 to-pink-100 ${rounded} ${className}`}>
      {isUrl ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : isPlaceholder ? (
        <div className="absolute inset-0 flex items-center justify-center text-purple-300">
          <ImageIcon size={36} strokeWidth={1.5} />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-5xl">{image}</div>
      )}
    </div>
  );
};
