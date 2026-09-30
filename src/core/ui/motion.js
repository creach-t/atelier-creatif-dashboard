// Réglages d'animation partagés : une seule « voix » de mouvement pour toute l'app.
export const spring = { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 };
export const softSpring = { type: 'spring', stiffness: 260, damping: 30 };
export const ease = { duration: 0.22, ease: [0.4, 0, 0.2, 1] };

export const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: ease },
  exit: { opacity: 0, y: -6, transition: { duration: 0.12 } },
};

// Entrée échelonnée des widgets : `custom` = position dans la page.
export const widgetVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  visible: (i = 0) => ({ opacity: 1, y: 0, scale: 1, transition: { ...softSpring, delay: Math.min(i, 10) * 0.045 } }),
  exit: { opacity: 0, scale: 0.94, transition: { duration: 0.16 } },
};

export const listItem = {
  hidden: { opacity: 0, x: -8 },
  visible: (i = 0) => ({ opacity: 1, x: 0, transition: { ...ease, delay: Math.min(i, 12) * 0.03 } }),
};
