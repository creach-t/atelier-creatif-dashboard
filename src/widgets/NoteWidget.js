import React, { useEffect, useState } from 'react';
import { StickyNote } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';

const NoteView = ({ config, updateConfig }) => {
  const [text, setText] = useState(config.text || '');
  useEffect(() => { setText(config.text || ''); }, [config.text]);

  // Enregistré à la sortie du champ (pas à chaque frappe) : une note = une entrée dans l'historique d'annulation.
  return (
    <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => { if (text !== (config.text || '')) updateConfig({ text }); }}
      placeholder="Écrivez ici : idées, rappels, à-faire…"
      maxLength={2000}
      aria-label="Note"
      className="flex-1 min-h-0 w-full resize-none bg-amber-50/60 rounded-xl p-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
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
