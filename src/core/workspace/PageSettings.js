import React, { useState } from 'react';
import { ArrowDown, ArrowUp, RotateCcw, Trash2 } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { Segmented } from '../config/ConfigForm';
import { PAGE_ICONS } from '../shell/icons';
import { PERIOD_OPTIONS } from '../metrics/periods';
import { useWorkspace } from './WorkspaceProvider';

const Confirm = ({ label, onConfirm, icon: Icon, danger }) => {
  const [armed, setArmed] = useState(false);
  return (
    <button
      type="button"
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      onBlur={() => setArmed(false)}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
        armed ? 'bg-rose-500 text-white' : danger ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' : 'text-purple-700 bg-purple-50 hover:bg-purple-100'
      }`}
    >
      <Icon size={16} /> {armed ? 'Confirmer ?' : label}
    </button>
  );
};

// Réglages d'une page : nom, icône, période par défaut, ordre dans le menu, réinitialisation, suppression.
export const PageSettings = ({ open, onClose }) => {
  const { page, pages, updatePage, movePage, resetPage, removePage } = useWorkspace();
  if (!page) return <Sheet open={false} onClose={onClose} />;
  const index = pages.findIndex((p) => p.id === page.id);

  return (
    <Sheet open={open} onClose={onClose} title="Réglages de la page" subtitle={page.title}>
      <div className="space-y-6">
        <div>
          <label htmlFor="page-title" className="block text-sm font-semibold text-gray-800 mb-2">Nom</label>
          <input
            id="page-title"
            value={page.title}
            maxLength={30}
            onChange={(e) => updatePage(page.id, { title: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-white border border-purple-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">Icône</p>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(PAGE_ICONS).map(([name, Icon]) => (
              <button
                key={name}
                type="button"
                aria-label={name}
                aria-pressed={page.icon === name}
                onClick={() => updatePage(page.id, { icon: name })}
                className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                  page.icon === name ? 'bg-purple-500 text-white shadow-md scale-105' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                }`}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">Période affichée</p>
          <Segmented
            value={page.period}
            options={PERIOD_OPTIONS.map((p) => ({ value: p.id, label: p.label }))}
            onChange={(period) => updatePage(page.id, { period, monthOffset: 0 })}
            size="sm"
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">Position dans le menu</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={index <= 0}
              onClick={() => movePage(page.id, -1)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-gray-700 bg-purple-50 hover:bg-purple-100 rounded-xl disabled:opacity-40"
            >
              <ArrowUp size={16} /> Monter
            </button>
            <button
              type="button"
              disabled={index >= pages.length - 1}
              onClick={() => movePage(page.id, 1)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-gray-700 bg-purple-50 hover:bg-purple-100 rounded-xl disabled:opacity-40"
            >
              <ArrowDown size={16} /> Descendre
            </button>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Confirm label="Réinitialiser" icon={RotateCcw} onConfirm={() => { resetPage(page.id); onClose(); }} />
          {pages.length > 1 && (
            <Confirm label="Supprimer" icon={Trash2} danger onConfirm={() => { removePage(page.id); onClose(); }} />
          )}
        </div>
      </div>
    </Sheet>
  );
};
