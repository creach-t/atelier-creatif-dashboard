import React, { useEffect } from 'react';
import { X } from 'lucide-react';

// Fenêtre modale : se ferme au clic en dehors et sur Échap. Le cadre arrondi coupe son contenu
// (overflow-hidden) et seul le corps défile, sous un en-tête fixe — la barre de défilement ne
// vient donc plus mordre sur les angles arrondis.
export const Modal = ({ title, subtitle, onClose, maxWidth = 'max-w-lg', dismissOnBackdrop = true, children }) => {
  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"
      // mousedown (et pas click) : sélectionner du texte depuis la fenêtre jusqu'à l'extérieur ne la ferme pas.
      onMouseDown={(e) => { if (dismissOnBackdrop && e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${maxWidth} max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-xl border border-purple-100 overflow-hidden`}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-purple-100 shrink-0">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Fermer" className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg shrink-0">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto scroll-soft">{children}</div>
      </div>
    </div>
  );
};
