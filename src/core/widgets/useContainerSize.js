import { useEffect, useRef, useState } from 'react';

// Paliers de taille : les widgets adaptent leur densité à ces paliers plutôt qu'à des pixels bruts.
//   hTier : xs < 130 px · sm < 210 · md < 340 · lg ≥ 340 (hauteur utile du corps du widget)
//   wTier : xs < 260 px · sm < 380 · md < 560 · lg ≥ 560
const tierOf = (v, [a, b, c]) => (v < a ? 'xs' : v < b ? 'sm' : v < c ? 'md' : 'lg');
export const H_STEPS = [130, 210, 340];
export const W_STEPS = [260, 380, 560];

// Taille réelle d'un conteneur (ResizeObserver), mise à jour en direct pendant qu'on redimensionne.
// Un widget adapte ainsi son contenu (version compacte, moins de lignes, graphique sans axes...) sans
// dépendre de la largeur de l'écran. `measured` = false tant qu'aucune mesure n'est arrivée.
export function useContainerSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((prev) => (Math.abs(prev.width - width) < 1 && Math.abs(prev.height - height) < 1 ? prev : { width, height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const measured = size.width > 0;
  return [ref, {
    ...size,
    measured,
    compact: measured && (size.width < 300 || size.height < 170),
    // Sans mesure on suppose « grand » : pas de flash de version réduite au premier rendu.
    hTier: measured ? tierOf(size.height, H_STEPS) : 'lg',
    wTier: measured ? tierOf(size.width, W_STEPS) : 'lg',
  }];
}
