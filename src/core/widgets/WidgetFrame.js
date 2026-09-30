import React from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, GripVertical, Lock, SlidersHorizontal, Trash2, AlertTriangle } from 'lucide-react';
import { getWidget, resolveConfig } from './registry';
import { UNIVERSAL_DEFAULTS } from './common';
import { useContainerSize } from './useContainerSize';
import { useData } from '../data/DataProvider';
import { widgetVariants } from '../ui/motion';

// Un widget qui plante ne doit jamais vider toute la page.
class WidgetBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error(`Widget « ${this.props.type} » en erreur`, error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 p-4 text-center text-sm text-gray-500">
        <AlertTriangle size={20} className="text-amber-500" />
        Ce widget a rencontré un problème.
        <button className="text-purple-600 font-semibold" onClick={() => this.setState({ failed: false })}>Réessayer</button>
      </div>
    );
  }
}

const Skeleton = () => (
  <div className="absolute inset-0 p-4 space-y-3 animate-pulse bg-white z-10" aria-hidden="true">
    <div className="h-4 w-1/3 rounded bg-purple-100" />
    <div className="h-8 w-1/2 rounded bg-purple-50" />
    <div className="h-full max-h-24 rounded-xl bg-purple-50" />
  </div>
);

const IconBtn = ({ label, onClick, danger, primary, children }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    // Ne pas laisser la grille démarrer un glisser depuis un bouton.
    onMouseDown={(e) => e.stopPropagation()}
    onTouchStart={(e) => e.stopPropagation()}
    className={`p-2 rounded-lg transition-colors ${
      primary ? 'text-white bg-purple-500 hover:bg-purple-600'
        : danger ? 'text-rose-500 hover:bg-rose-50'
          : 'text-gray-500 hover:bg-purple-50 hover:text-purple-700'
    }`}
  >
    {children}
  </button>
);

// Cadre commun de tous les widgets : carte, titre, verrou, barre d'outils, chargement, erreurs.
// Un widget est verrouillé par défaut (contenu utilisable, rien ne bouge par accident). Une icône de cadenas,
// visible au survol (toujours visible sur écran tactile), le déverrouille : poignée de déplacement, coin de
// redimensionnement et barre d'outils n'existent que pour ce widget-là.
export const WidgetFrame = ({ widget, index, unlocked = false, onUnlock, onLock, onSettings, onDuplicate, onRemove, onConfig }) => {
  const def = getWidget(widget.type);
  const { loading, orders } = useData();
  const [bodyRef, size] = useContainerSize();
  if (!def) return null;

  const config = { ...UNIVERSAL_DEFAULTS, ...resolveConfig(def, widget.config) };
  const title = (config.title || '').trim() || (def.getTitle ? def.getTitle(config) : def.title);
  const Icon = def.icon;
  const Component = def.component;
  const showHeader = config.showTitle && !unlocked;
  const lockable = Boolean(onUnlock);

  return (
    <motion.div
      custom={index}
      variants={widgetVariants}
      initial="hidden"
      animate="visible"
      className={`group relative h-full flex flex-col rounded-2xl bg-white border shadow-sm overflow-hidden transition-shadow ${
        unlocked ? 'border-purple-400 border-dashed shadow-lg ring-2 ring-purple-200' : 'border-purple-100'
      }`}
    >
      {unlocked && (
        <div className="widget-handle flex items-center gap-1 pl-2 pr-1 py-1 bg-purple-50 border-b border-purple-100 cursor-grab active:cursor-grabbing touch-none select-none shrink-0">
          <GripVertical size={18} className="text-purple-400 shrink-0" />
          <span className="flex-1 min-w-0 truncate text-sm font-semibold text-purple-800 px-1">{title}</span>
          <IconBtn label="Réglages du widget" onClick={onSettings}><SlidersHorizontal size={16} /></IconBtn>
          <IconBtn label="Dupliquer" onClick={onDuplicate}><Copy size={16} /></IconBtn>
          <IconBtn label="Supprimer" onClick={onRemove} danger><Trash2 size={16} /></IconBtn>
          <IconBtn label="Terminer et verrouiller" onClick={onLock} primary><Check size={16} /></IconBtn>
        </div>
      )}

      {showHeader && (
        <div className="flex items-center gap-2 px-4 pt-3.5 pb-1 shrink-0">
          {Icon && <Icon size={16} className="text-purple-500 shrink-0" />}
          <h3 className="text-sm font-semibold text-gray-800 truncate">{title}</h3>
        </div>
      )}

      <div ref={bodyRef} className={`@container relative flex-1 min-h-0 flex flex-col ${def.bleed ? '' : 'px-4 pb-4 pt-2'}`}>
        {loading && orders.length === 0 && <Skeleton />}
        <WidgetBoundary type={widget.type}>
          <Component config={config} widget={widget} size={size} updateConfig={onConfig} unlocked={unlocked} />
        </WidgetBoundary>
        {unlocked && (
          // Déverrouillé, le contenu ne réagit plus (pas de fiche qui s'ouvre par erreur) : toucher = régler.
          <button type="button" aria-label={`Régler ${title}`} onClick={onSettings} className="absolute inset-0 z-20 cursor-pointer bg-transparent" />
        )}
      </div>

      {lockable && !unlocked && (
        <button
          type="button"
          aria-label={`Modifier ${title}`}
          title="Déverrouiller pour déplacer, redimensionner ou régler"
          onClick={onUnlock}
          // Survol sur souris ; sur écran tactile (pas de survol) l'icône reste visible, discrète.
          className="absolute top-2 right-2 z-30 p-1.5 rounded-lg bg-white/90 backdrop-blur border border-purple-100 shadow-sm text-purple-500 hover:text-purple-700 hover:bg-purple-50 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 focus-visible:opacity-100 focus-visible:scale-100 [@media(hover:none)]:opacity-70 [@media(hover:none)]:scale-100 transition-all"
        >
          <Lock size={14} />
        </button>
      )}
    </motion.div>
  );
};
