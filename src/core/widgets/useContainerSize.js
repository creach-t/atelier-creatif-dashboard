import { useEffect, useRef, useState } from 'react';

// Taille réelle d'un conteneur (ResizeObserver). Un widget redimensionné par l'utilisateur adapte ainsi son
// contenu (version compacte, moins de lignes...) sans dépendre de la largeur de l'écran.
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

  return [ref, { ...size, compact: size.width > 0 && (size.width < 300 || size.height < 170) }];
}
