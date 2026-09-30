import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useIsNarrow } from '../../hooks/useIsNarrow';
import { spring } from './motion';

// Panneau contextuel : feuille qui monte du bas sur mobile (glissable pour fermer), tiroir à droite sur
// grand écran. Sert au catalogue de widgets, aux réglages d'un widget, aux réglages de page.
// `pinned` : zone fixe sous l'en-tête (ne défile pas) — sert à garder un aperçu toujours visible pendant qu'on règle.
export const Sheet = ({ open, onClose, title, subtitle, children, footer, pinned, dim = true }) => {
  const narrow = useIsNarrow(767);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const panel = narrow
    ? {
        className: 'fixed inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl',
        initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' },
        drag: 'y', dragConstraints: { top: 0, bottom: 0 }, dragElastic: { top: 0, bottom: 0.6 },
        onDragEnd: (_e, info) => { if (info.offset.y > 110 || info.velocity.y > 600) onClose(); },
      }
    : {
        className: 'fixed top-0 right-0 bottom-0 w-[26rem] max-w-full rounded-l-3xl',
        initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' },
      };

  // Rendu à la racine du document : un panneau ouvert depuis l'en-tête (ou tout parent qui crée son propre
  // niveau d'empilement) doit rester au-dessus de la navigation.
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]" role="presentation">
          <motion.button
            type="button"
            aria-label="Fermer"
            className={`absolute inset-0 w-full h-full cursor-default ${dim ? 'bg-slate-900/30' : 'bg-transparent'}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            transition={spring}
            {...panel}
            className={`${panel.className} flex flex-col bg-white shadow-2xl border border-purple-100 overflow-hidden`}
          >
            {narrow && <div className="mx-auto mt-2.5 mb-1 h-1.5 w-10 rounded-full bg-purple-200 shrink-0" />}
            <div className="flex items-start justify-between gap-3 px-5 pt-3 pb-3 sm:pt-5 border-b border-purple-50 shrink-0">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
                {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
              </div>
              <button onClick={onClose} aria-label="Fermer" className="p-2 -mr-2 text-gray-500 hover:bg-purple-50 rounded-xl shrink-0">
                <X size={18} />
              </button>
            </div>
            {pinned && <div className="shrink-0 px-5 py-3 bg-purple-25 border-b border-purple-100">{pinned}</div>}
            <div className="flex-1 min-h-0 overflow-y-auto scroll-soft px-5 py-4">{children}</div>
            {footer && <div className="shrink-0 border-t border-purple-50 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
