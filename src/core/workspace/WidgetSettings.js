import React from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { ConfigForm, Segmented } from '../config/ConfigForm';
import { getWidget, resolveConfig } from '../widgets/registry';
import { UNIVERSAL_SCHEMA, UNIVERSAL_DEFAULTS } from '../widgets/common';
import { useWorkspace } from './WorkspaceProvider';
import { WidgetPreview } from '../widgets/WidgetPreview';
import { useIsNarrow } from '../../hooks/useIsNarrow';
import { ROW_HEIGHT, MARGIN } from './model';

const WIDTHS = {
  lg: [{ value: 3, label: '¼' }, { value: 4, label: '⅓' }, { value: 6, label: '½' }, { value: 8, label: '⅔' }, { value: 12, label: 'Pleine' }],
  md: [{ value: 3, label: '½' }, { value: 6, label: 'Pleine' }],
};
const HEIGHTS = [
  { value: 0.6, label: 'Compact' }, { value: 1, label: 'Normal' }, { value: 1.5, label: 'Grand' }, { value: 2, label: 'Très grand' },
];

// Taille réelle du widget sur la page, en pixels (colonnes de grille selon l'écran) : l'aperçu lui donne les mêmes proportions.
const COLUMN = { lg: 89, md: 82 };
const pixelsOf = (layout, breakpoint) => ({
  w: breakpoint === 'sm' ? 345 : layout.w * COLUMN[breakpoint] + (layout.w - 1) * MARGIN,
  h: layout.h * ROW_HEIGHT + (layout.h - 1) * MARGIN,
});

const nearest = (options, value) => options.reduce((best, o) => (Math.abs(o.value - value) < Math.abs(best.value - value) ? o : best), options[0]);

// Réglages d'un widget : taille, puis tout ce que son schéma déclare. Les changements s'appliquent en direct.
export const WidgetSettings = ({ widgetId, breakpoint, onClose }) => {
  const { page, updateConfig, resizeWidget, duplicateWidget, removeWidget } = useWorkspace();
  const widget = page && page.widgets.find((w) => w.id === widgetId);
  const def = widget && getWidget(widget.type);
  const narrow = useIsNarrow(767);
  const open = Boolean(widget && def);
  if (!open) return <Sheet open={false} onClose={onClose} />;

  const config = { ...UNIVERSAL_DEFAULTS, ...resolveConfig(def, widget.config) };
  const layout = (page.layouts[breakpoint] || []).find((it) => it.i === widgetId);
  const widthOptions = WIDTHS[breakpoint];
  const baseH = def.size.h;
  const heightNow = layout ? nearest(HEIGHTS.map((h) => ({ value: h.value })), layout.h / baseH).value : 1;

  const setHeight = (factor) => {
    const h = Math.round(Math.min(def.size.maxH, Math.max(def.size.minH, baseH * factor)));
    resizeWidget(widgetId, breakpoint, { h });
  };

  return (
    <Sheet
      open
      onClose={onClose}
      dim={false}
      pinned={layout && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Aperçu en direct</p>
          <WidgetPreview def={def} config={config} pixels={pixelsOf(layout, breakpoint)} maxHeight={narrow ? 170 : 230} />
        </div>
      )}
      title={def.title}
      subtitle={narrow ? undefined : def.description}
      footer={(
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { duplicateWidget(widgetId); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl"
          >
            <Copy size={16} /> Dupliquer
          </button>
          <button
            type="button"
            onClick={() => { removeWidget(widgetId); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl"
          >
            <Trash2 size={16} /> Supprimer
          </button>
        </div>
      )}
    >
      <div className="space-y-6">
        <section className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400">Taille</h4>
          {widthOptions && layout && (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Largeur</label>
              <Segmented
                value={nearest(widthOptions, layout.w).value}
                options={widthOptions}
                onChange={(w) => resizeWidget(widgetId, breakpoint, { w: Math.min(w, breakpoint === 'md' ? 6 : 12), x: 0 })}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Hauteur</label>
            <Segmented value={heightNow} options={HEIGHTS} onChange={setHeight} size="sm" />
          </div>
          <p className="text-xs text-gray-500">Vous pouvez aussi tirer le coin du widget et le déplacer par sa poignée.</p>
        </section>

        {def.schema.length > 0 && (
          <section className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400">Contenu</h4>
            <ConfigForm schema={def.schema} config={config} onChange={(patch) => updateConfig(widgetId, patch)} />
          </section>
        )}

        <section className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400">Apparence</h4>
          <ConfigForm schema={UNIVERSAL_SCHEMA} config={config} onChange={(patch) => updateConfig(widgetId, patch)} />
        </section>
      </div>
    </Sheet>
  );
};
