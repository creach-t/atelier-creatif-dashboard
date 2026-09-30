import React, { useEffect, useRef, useState } from 'react';
import { WidgetFrame } from './WidgetFrame';
import { useContainerSize } from './useContainerSize';
import { ROW_HEIGHT, MARGIN } from '../workspace/model';

const COL = 89; // largeur d'une colonne de la grille bureau (~1200 px)
const NATIVE_W = { min: 300, max: 520 };
const NATIVE_H = { min: 120, max: 300 };
const clamp = (v, { min, max }) => Math.min(max, Math.max(min, v));
const noop = () => {};

// Ne monte l'aperçu que lorsqu'il approche de l'écran : le catalogue compte des dizaines d'entrées
// avec des graphiques, inutile de tout calculer d'un coup.
const useNearViewport = (eager) => {
  const ref = useRef(null);
  const [near, setNear] = useState(eager || typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const el = ref.current;
    if (near || !el) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  return [ref, near];
};

// Aperçu fidèle : le vrai widget, avec vos vraies données, rendu à sa proportion réelle puis réduit pour tenir
// dans la carte. Inerte : on ne clique pas dedans.
//   - catalogue : `entry` (widget + préréglage), taille en unités de grille ;
//   - réglages  : `def` + `config` en direct + `pixels` = taille réelle du widget sur la page, et `maxHeight`
//     pour que l'aperçu reste entièrement visible (réduit et centré si le widget est plus haut).
export const WidgetPreview = ({ entry, def: defProp, config: configProp, pixels, maxHeight }) => {
  const [box, size] = useContainerSize();
  const [visibleRef, near] = useNearViewport(Boolean(pixels));
  const def = defProp || entry.def;

  let nativeW;
  let nativeH;
  if (pixels) {
    nativeW = Math.max(200, pixels.w);
    nativeH = Math.max(90, pixels.h);
  } else {
    const { w, h } = entry.size;
    nativeW = clamp(w * COL + (w - 1) * MARGIN, NATIVE_W);
    nativeH = clamp(h * ROW_HEIGHT + (h - 1) * MARGIN, NATIVE_H);
  }

  // Un widget étroit remplit la carte à l'échelle 1 (catalogue) ; un widget large est réduit pour y tenir.
  const renderW = pixels ? nativeW : Math.max(nativeW, size.width);
  let scale = size.width > 0 ? size.width / renderW : 0;
  if (maxHeight && scale) scale = Math.min(scale, maxHeight / nativeH);
  if (pixels && scale > 1) scale = 1;

  const widget = { id: `preview-${def.type}`, type: def.type, config: { ...def.defaultConfig, ...(configProp || entry.config) } };
  const boxHeight = scale ? nativeH * scale : nativeH * 0.6;
  const shownW = renderW * scale;

  return (
    <div
      ref={(node) => { box.current = node; visibleRef.current = node; }}
      aria-hidden="true"
      className="relative w-full overflow-hidden rounded-xl bg-purple-25 border border-purple-100"
      style={{ height: boxHeight }}
    >
      {near && scale > 0 && (
        <div
          inert=""
          className="absolute top-0 pointer-events-none select-none"
          style={{ width: renderW, height: nativeH, transform: `scale(${scale})`, transformOrigin: 'top left', left: Math.max(0, (size.width - shownW) / 2) }}
        >
          <WidgetFrame widget={widget} index={0} onSettings={noop} onDuplicate={noop} onRemove={noop} onConfig={noop} />
        </div>
      )}
    </div>
  );
};
