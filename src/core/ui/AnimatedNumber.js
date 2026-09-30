import React, { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

// Compteur animé : la valeur glisse de l'ancienne à la nouvelle. `format` reçoit le nombre courant.
export const AnimatedNumber = ({ value, format = (n) => String(Math.round(n)), duration = 0.7, className = '' }) => {
  const reduce = useReducedMotion();
  const target = Number(value) || 0;
  const [shown, setShown] = useState(reduce ? target : 0);
  const from = useRef(reduce ? target : 0);

  useEffect(() => {
    if (reduce) { setShown(target); from.current = target; return undefined; }
    const controls = animate(from.current, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => { from.current = v; setShown(v); },
    });
    return () => controls.stop();
  }, [target, duration, reduce]);

  return <span className={`tabular-nums ${className}`}>{format(shown)}</span>;
};
