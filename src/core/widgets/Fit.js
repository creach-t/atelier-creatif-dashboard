import React, { useEffect, useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useContainerSize } from './useContainerSize';
import { spring } from '../ui/motion';

export const PAGER_H = 44;

// Barre de pagination : « 9–16 sur 40 », points cliquables (ou « 2 / 12 » si beaucoup de pages), flèches.
export const Pager = ({ page, pages, total, from, to, onPage }) => {
  const id = useId();
  return (
    <div className="shrink-0 flex items-center justify-between gap-2 px-4 border-t border-purple-50 bg-white" style={{ height: PAGER_H }}>
      <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
        {from}–{to} <span className="text-gray-400">sur {total}</span>
      </span>
      <div className="flex items-center gap-1">
        <button type="button" aria-label="Page précédente" disabled={page <= 0} onClick={() => onPage(page - 1)} className="p-1.5 text-gray-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
          <ChevronLeft size={16} />
        </button>
        {pages <= 6 ? (
          <div className="flex items-center gap-1.5 px-1" role="tablist">
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} type="button" role="tab" aria-selected={i === page} aria-label={`Page ${i + 1}`} onClick={() => onPage(i)} className="relative w-2 h-2 rounded-full bg-purple-200 hover:bg-purple-300">
                {i === page && <motion.span layoutId={`dot-${id}`} transition={spring} className="absolute -inset-0.5 rounded-full bg-purple-600" />}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-xs font-semibold text-gray-600 tabular-nums px-1 min-w-[3rem] text-center">{page + 1} / {pages}</span>
        )}
        <button type="button" aria-label="Page suivante" disabled={page >= pages - 1} onClick={() => onPage(page + 1)} className="p-1.5 text-gray-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

// État de pagination partagé : page courante bornée, remise à zéro quand la liste change (recherche, filtre, tri).
function usePage(pages, resetKey) {
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [resetKey]);
  const current = Math.min(page, Math.max(0, pages - 1));
  useEffect(() => { if (page !== current) setPage(current); }, [page, current]);
  return [current, setPage];
}

// Si même UNE ligne ne tient pas dans la hauteur du widget, le contenu est réduit à l'échelle (jamais coupé).
const shrinkToFit = (available, needed) => (needed > 0 && available > 0 && available < needed ? Math.max(0.4, available / needed) : 1);

const Slide = ({ pageKey, className, style, scale = 1, children }) => (
  <AnimatePresence mode="wait" initial={false}>
    <motion.div
      key={pageKey}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      className={className}
      style={scale < 1 ? { ...style, scale, transformOrigin: 'top center' } : style}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

// Liste sans défilement : calcule combien de lignes (de hauteur fixe `rowHeight`) tiennent dans la hauteur du
// widget ; tout tient = aucune pagination, sinon les lignes se répartissent en pages avec une barre de pagination.
// Suit la taille en direct : agrandir le widget affiche plus de lignes par page.
export const FitList = ({ items, rowHeight, gap = 8, renderItem, resetKey, padding = 'px-3', padBottom = 12, className = '' }) => {
  const [ref, size] = useContainerSize();
  const n = items.length;
  const h = size.measured ? size.height : 0;
  const slot = rowHeight + gap;

  let pageSize;
  if (!h) pageSize = Math.max(1, Math.min(n, 4));
  else {
    const fitAll = Math.floor((h - padBottom + gap) / slot);
    pageSize = n <= fitAll ? Math.max(n, 1) : Math.max(1, Math.floor((h - PAGER_H - padBottom + gap) / slot));
  }
  const pages = Math.max(1, Math.ceil(n / pageSize));
  const [page, setPage] = usePage(pages, resetKey);
  const start = page * pageSize;
  const visible = items.slice(start, start + pageSize);
  const scale = h ? shrinkToFit(h - padBottom - (pages > 1 ? PAGER_H : 0), visible.length * rowHeight + (visible.length - 1) * gap) : 1;

  return (
    <div ref={ref} className={`flex-1 min-h-0 flex flex-col ${className}`}>
      <Slide pageKey={page} scale={scale} className={`flex-1 min-h-0 overflow-hidden flex flex-col ${padding}`} style={{ gap }}>
        {visible.map((item, i) => renderItem(item, i, start + i))}
      </Slide>
      {pages > 1 && <Pager page={page} pages={pages} total={n} from={start + 1} to={start + visible.length} onPage={setPage} />}
    </div>
  );
};

// Grille de cartes sans défilement : nombre de colonnes selon la largeur (`minCol`), nombre de lignes selon la
// hauteur ; `cardHeight(largeurCarte)` donne la hauteur d'une carte (image carrée + bloc texte fixe).
export const FitGrid = ({ items, minCol = 136, gap = 12, cardHeight, renderItem, resetKey, padX = 32, padBottom = 12 }) => {
  const [ref, size] = useContainerSize();
  const n = items.length;
  const w = size.measured ? size.width : 0;
  const h = size.measured ? size.height : 0;
  const cols = w ? Math.max(1, Math.floor((w - padX + gap) / (minCol + gap))) : 2;
  const cardW = w ? (w - padX - (cols - 1) * gap) / cols : minCol;
  const slot = cardHeight(cardW) + gap;

  let pageSize;
  if (!h) pageSize = Math.max(1, Math.min(n, cols * 2));
  else {
    const rowsAll = Math.floor((h - padBottom + gap) / slot);
    const rows = n <= rowsAll * cols ? Math.max(1, Math.ceil(n / cols)) : Math.max(1, Math.floor((h - PAGER_H - padBottom + gap) / slot));
    pageSize = rows * cols;
  }
  const pages = Math.max(1, Math.ceil(n / pageSize));
  const [page, setPage] = usePage(pages, resetKey);
  const start = page * pageSize;
  const visible = items.slice(start, start + pageSize);
  const rowsShown = Math.ceil(visible.length / cols);
  const scale = h ? shrinkToFit(h - padBottom - (pages > 1 ? PAGER_H : 0), rowsShown * cardHeight(cardW) + (rowsShown - 1) * gap) : 1;

  return (
    <div ref={ref} className="flex-1 min-h-0 flex flex-col">
      <Slide pageKey={page} scale={scale} className="flex-1 min-h-0 overflow-hidden" style={{ padding: `0 ${padX / 2}px` }}>
        <div className="grid" style={{ gap, gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {visible.map((item, i) => renderItem(item, i, start + i))}
        </div>
      </Slide>
      {pages > 1 && <Pager page={page} pages={pages} total={n} from={start + 1} to={start + visible.length} onPage={setPage} />}
    </div>
  );
};

// Pagination à taille fixe (contenus de rapport, dont la hauteur n'est pas pilotée par le widget).
export const Paged = ({ items, pageSize = 6, renderItem, resetKey, className = '' }) => {
  const n = items.length;
  const pages = Math.max(1, Math.ceil(n / pageSize));
  const [page, setPage] = usePage(pages, resetKey);
  const start = page * pageSize;
  const visible = items.slice(start, start + pageSize);
  return (
    <div className={className}>
      <div>{visible.map((item, i) => renderItem(item, i, start + i))}</div>
      {pages > 1 && <Pager page={page} pages={pages} total={n} from={start + 1} to={start + visible.length} onPage={setPage} />}
    </div>
  );
};

// Budget de hauteur d'une barre d'outils : chaque élément (recherche, compteur, filtres, tri) n'est affiché que s'il
// reste, une fois compté, assez de place (`minContent`) pour au moins une ligne ou une carte utile. On retire donc
// d'abord le tri, puis les filtres, etc. — jamais le contenu. Usage : const take = toolbarBudget(h, 150); take(56) -> bool.
export const toolbarBudget = (height, minContent) => {
  let used = 0;
  return (px) => {
    if (used + px + minContent > height) return false;
    used += px;
    return true;
  };
};
