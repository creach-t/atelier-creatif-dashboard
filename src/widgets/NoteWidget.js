import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StickyNote } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';

const MAX_FONT = 15;
const MIN_FONT = 9;

// Pas de défilement : quand le texte dépasse le bloc, la police rétrécit (jusqu'à 9 px) pour que tout reste visible.
const NoteView = ({ config, updateConfig, size }) => {
  const [text, setText] = useState(config.text || '');
  const [font, setFont] = useState(MAX_FONT);
  const ref = useRef(null);
  useEffect(() => { setText(config.text || ''); }, [config.text]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let f = MAX_FONT;
    el.style.fontSize = `${f}px`;
    while (el.scrollHeight > el.clientHeight + 1 && f > MIN_FONT) {
      f -= 0.5;
      el.style.fontSize = `${f}px`;
    }
    setFont(f);
  }, [text, size.width, size.height]);

  // Enregistré à la sortie du champ (pas à chaque frappe) : une note = une entrée dans l'historique d'annulation.
  return (
    <textarea
      ref={ref}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => { if (text !== (config.text || '')) updateConfig({ text }); }}
      placeholder="Écrivez ici : idées, rappels, à-faire…"
      maxLength={2000}
      aria-label="Note"
      style={{ fontSize: font }}
      className="flex-1 min-h-0 w-full resize-none overflow-hidden bg-amber-50/60 rounded-xl p-3 text-gray-800 placeholder-gray-400 leading-snug focus:outline-none focus:ring-2 focus:ring-amber-300"
    />
  );
};

defineWidget({
  type: 'note',
  title: 'Note',
  description: 'Un bloc-notes libre pour vos idées et rappels, sauvegardé avec la page.',
  icon: StickyNote,
  category: 'Outils',
  size: { w: 4, h: 7, minW: 2, minH: 4, maxW: 12, maxH: 20 },
  defaultConfig: { text: '' },
  component: NoteView,
});
