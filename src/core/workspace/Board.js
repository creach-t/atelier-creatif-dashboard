import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Responsive } from 'react-grid-layout';
import { motion } from 'framer-motion';
import { LayoutGrid, Plus } from 'lucide-react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useWorkspace } from './WorkspaceProvider';
import { BREAKPOINTS, COLS, ROW_HEIGHT, MARGIN, breakpointFor } from './model';
import { getWidget } from '../widgets/registry';
import { WidgetFrame } from '../widgets/WidgetFrame';
import { WidgetSettings } from './WidgetSettings';
import { pageVariants } from '../ui/motion';
import { useContainerSize } from '../widgets/useContainerSize';

// Ajoute à chaque bloc ses bornes de taille (venant du registre) et son état de verrou. Rien de cela n'est
// sauvegardé : les bornes suivent le code, le verrou est un état d'écran. Seul le widget déverrouillé peut
// être déplacé ou redimensionné.
const withLimits = (layouts, widgets, unlockedId) => {
  const byId = Object.fromEntries(widgets.map((w) => [w.id, getWidget(w.type)]));
  const out = {};
  Object.entries(layouts).forEach(([bp, items]) => {
    out[bp] = items.map((it) => {
      const def = byId[it.i];
      const s = def ? def.size : {};
      const free = it.i === unlockedId;
      return {
        ...it,
        minW: bp === 'sm' ? 1 : bp === 'md' ? Math.min(s.minW || 2, 3) : s.minW,
        maxW: bp === 'sm' ? 1 : bp === 'md' ? 6 : s.maxW,
        minH: s.minH,
        maxH: s.maxH,
        isDraggable: free,
        isResizable: free,
      };
    });
  });
  return out;
};

const EmptyPage = ({ onAdd }) => (
  <div className="flex flex-col items-center text-center py-16 px-6">
    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-100 to-pink-100 text-purple-500 flex items-center justify-center mb-4">
      <LayoutGrid size={28} />
    </div>
    <h3 className="text-lg font-semibold text-gray-900">Cette page est vide</h3>
    <p className="text-sm text-gray-500 mt-1 max-w-xs">Composez-la avec les widgets de votre choix : chiffres, graphiques, listes, raccourcis…</p>
    <button onClick={onAdd} className="mt-5 flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-pink-400 to-purple-500 rounded-xl shadow-lg">
      <Plus size={16} /> Ajouter un widget
    </button>
  </div>
);

// La page : grille de widgets (la période et les actions de page sont dans la barre du haut). Tout est verrouillé par défaut ; l'icône de cadenas
// d'un widget (au survol, ou toujours visible au doigt) le déverrouille seul : poignée, coin d'agrandissement et
// outils. Échap, un clic ailleurs ou le bouton ✓ le reverrouille.
export const Board = ({ onAddWidget }) => {
  const { page, applyLayouts, removeWidget, duplicateWidget, updateConfig } = useWorkspace();
  const [gridRef, { width: measured }] = useContainerSize();
  // Une largeur nulle (volet ou onglet masqué) n'est pas une vraie mesure : on garde la dernière valide,
  // sinon tous les widgets s'effondreraient en colonne de 0 px.
  const [width, setWidth] = useState(0);
  useEffect(() => { if (measured > 0) setWidth(measured); }, [measured]);
  // Dérivé de la largeur (et non de onBreakpointChange, qui ne notifie pas l'état initial).
  const breakpoint = breakpointFor(width);
  const [settingsId, setSettingsId] = useState(null);
  const [unlockedId, setUnlockedId] = useState(null);

  const layouts = useMemo(() => withLimits(page.layouts, page.widgets, unlockedId), [page.layouts, page.widgets, unlockedId]);
  const onLayoutChange = useCallback((_current, all) => { if (unlockedId) applyLayouts(all); }, [unlockedId, applyLayouts]);
  const indexOf = useMemo(() => Object.fromEntries(page.widgets.map((w, i) => [w.id, i])), [page.widgets]);

  // Reverrouillage : Échap, ou un appui hors du widget déverrouillé (les panneaux ouverts ne comptent pas).
  useEffect(() => {
    if (!unlockedId) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('[role="dialog"]')) setUnlockedId(null); };
    const onDown = (e) => {
      if (e.target.closest && (e.target.closest(`[data-widget-id="${unlockedId}"]`) || e.target.closest('[role="dialog"]'))) return;
      setUnlockedId(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown); };
  }, [unlockedId]);

  // Un widget supprimé (ou annulé) ne doit pas rester « déverrouillé ».
  useEffect(() => {
    if (unlockedId && !page.widgets.some((w) => w.id === unlockedId)) setUnlockedId(null);
  }, [page.widgets, unlockedId]);

  const remove = (id) => { setUnlockedId(null); removeWidget(id); };

  return (
    <motion.div key={page.id} variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-3 sm:p-6 max-w-[1500px] mx-auto pb-28 md:pb-10">
      {page.widgets.length === 0 && <EmptyPage onAdd={onAddWidget} />}

      {/* Le conteneur de mesure existe toujours (même page vide) pour que l'observateur soit branché. */}
      <div ref={gridRef}>
        {page.widgets.length > 0 && width > 0 && (
          <Responsive
            width={width}
            className="cashly-grid"
            layouts={layouts}
            breakpoints={BREAKPOINTS}
            cols={COLS}
            rowHeight={ROW_HEIGHT}
            margin={[MARGIN, MARGIN]}
            containerPadding={[0, 0]}
            draggableHandle=".widget-handle"
            draggableCancel="button"
            onLayoutChange={onLayoutChange}
            compactType="vertical"
          >
            {page.widgets.map((widget) => (
              <div key={widget.id} data-widget-id={widget.id}>
                <WidgetFrame
                  widget={widget}
                  index={indexOf[widget.id]}
                  unlocked={widget.id === unlockedId}
                  onUnlock={() => setUnlockedId(widget.id)}
                  onLock={() => setUnlockedId(null)}
                  onSettings={() => setSettingsId(widget.id)}
                  onDuplicate={() => duplicateWidget(widget.id)}
                  onRemove={() => remove(widget.id)}
                  onConfig={(patch) => updateConfig(widget.id, patch)}
                />
              </div>
            ))}
          </Responsive>
        )}
      </div>

      <WidgetSettings widgetId={settingsId} breakpoint={breakpoint} onClose={() => setSettingsId(null)} />
    </motion.div>
  );
};
