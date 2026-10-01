import React from 'react';
import { Plus, Settings2, Undo2 } from 'lucide-react';
import { NotificationBell } from '../features/orders/NotificationBell';
import { PeriodPicker } from '../core/workspace/PeriodPicker';
import { useData } from '../data/DataProvider';
import { useOverlays } from '../features/overlays/OverlayProvider';
import { useWorkspace } from '../core/workspace/WorkspaceProvider';

const ToolButton = ({ label, onClick, primary, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className={`flex items-center gap-2 px-2.5 sm:px-3 py-2 text-sm font-semibold rounded-xl transition-colors shrink-0 ${
      primary
        ? 'text-white bg-gradient-to-r from-pink-400 to-purple-500 shadow-sm hover:shadow-md'
        : 'text-purple-700 bg-white border border-purple-100 hover:bg-purple-50'
    }`}
  >
    {children}
  </button>
);

// Barre du haut : titre de la page, filtre de période (sur la même ligne dès que la largeur le permet,
// sinon juste dessous), actions de la page et notifications.
export const Header = ({ onAddWidget, onPageSettings }) => {
  const { orders } = useData();
  const { openOrder } = useOverlays();
  const { page, isSettings, canUndo, undo } = useWorkspace();
  const title = isSettings ? 'Réglages' : page.title;

  return (
    <header className="relative z-30 bg-white border-b border-purple-100 px-4 sm:px-6 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate min-w-0 flex-1 lg:flex-none">{title}</h2>

        {/* Ligne à part (pleine largeur) en dessous de lg ; entre le titre et les actions au-delà. */}
        {!isSettings && (
          <div className="order-last w-full lg:w-auto lg:order-none lg:flex-1 lg:min-w-0">
            <PeriodPicker />
          </div>
        )}

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
          {!isSettings && (
            <>
              {canUndo && <ToolButton label="Annuler la dernière modification" onClick={undo}><Undo2 size={16} /></ToolButton>}
              <ToolButton label="Réglages de la page" onClick={onPageSettings}><Settings2 size={16} /></ToolButton>
              <ToolButton label="Ajouter un widget" onClick={onAddWidget} primary>
                <Plus size={16} /><span className="hidden sm:inline lg:hidden 2xl:inline">Ajouter</span>
              </ToolButton>
            </>
          )}
          <NotificationBell orders={orders} onSelectOrder={openOrder} />
        </div>
      </div>
    </header>
  );
};
