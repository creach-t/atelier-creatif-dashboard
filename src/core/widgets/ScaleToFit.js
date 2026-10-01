import React, { useLayoutEffect, useRef, useState } from 'react';
import { useContainerSize } from './useContainerSize';

// Pas de défilement dans un widget : quand un contenu de taille fixe (compteurs, légende, rapport, boutons…) est
// plus haut que la place disponible, il est RÉDUIT à l'échelle pour tout montrer, centré, plutôt que coupé ou
// scrollé. Jamais agrandi (échelle max 1) ; `min` évite de descendre sous une taille illisible.
// Le contenu est mis en page à la largeur réelle du widget (ses variantes @md: etc. restent justes) ; seule sa
// hauteur naturelle est mesurée, donc aucune boucle de mesure.
export const ScaleToFit = ({ children, min = 0.45, className = '', center = false }) => {
  const [outerRef, outer] = useContainerSize();
  const innerRef = useRef(null);
  const [natural, setNatural] = useState(0);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return undefined;
    setNatural(el.offsetHeight);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => setNatural(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = outer.measured && natural > 0 ? Math.max(min, Math.min(1, outer.height / natural)) : 1;
  // `center` : le contenu qui ne remplit pas toute la hauteur est centré au lieu de laisser le vide en dessous.
  const top = center && outer.measured && natural > 0 ? Math.max(0, (outer.height - natural * scale) / 2) : 0;

  return (
    <div ref={outerRef} className={`relative flex-1 min-h-0 overflow-hidden ${className}`}>
      <div
        ref={innerRef}
        className="absolute inset-x-0"
        style={{ top, transform: scale < 1 ? `scale(${scale})` : undefined, transformOrigin: 'top center' }}
      >
        {children}
      </div>
    </div>
  );
};
