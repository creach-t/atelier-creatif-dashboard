import React, { useState } from 'react';
import { LayoutGrid, RotateCcw } from 'lucide-react';
import { Card } from '../../ui/Card';
import { useWorkspace } from '../../core/workspace/WorkspaceProvider';

export const WorkspaceCard = () => {
  const { pages, resetWorkspace } = useWorkspace();
  const [armed, setArmed] = useState(false);

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <LayoutGrid size={20} className="text-purple-500" /> Personnalisation
      </h3>
      <p className="text-sm text-gray-600 mt-2">
        Vos {pages.length} pages sont composées de widgets. Ouvrez une page et touchez « Personnaliser » pour ajouter,
        déplacer, redimensionner ou régler les blocs.
      </p>
      <button
        type="button"
        onClick={() => { if (armed) { resetWorkspace(); setArmed(false); } else setArmed(true); }}
        onBlur={() => setArmed(false)}
        className={`mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors ${armed ? 'bg-rose-500 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
      >
        <RotateCcw size={16} /> {armed ? 'Confirmer : tout remettre par défaut ?' : 'Réinitialiser toutes les pages'}
      </button>
    </Card>
  );
};
