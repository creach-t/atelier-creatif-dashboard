import { useEffect, useState } from 'react';

// true sous le seuil (px). Sert aux rares cas où Tailwind ne suffit pas (largeurs passées en props,
// ex. axes Recharts).
export function useIsNarrow(maxWidth = 480) {
  const query = `(max-width: ${maxWidth}px)`;
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setNarrow(e.matches);
    setNarrow(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return narrow;
}
