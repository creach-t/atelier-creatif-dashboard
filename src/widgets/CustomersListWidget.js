import React, { useMemo, useState } from 'react';
import { Plus, Edit, Mail, Users } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';
import { useData } from '../core/data/DataProvider';
import { useOverlays } from '../core/overlays/OverlayProvider';
import { SortHeader } from '../components/ui/SortHeader';
import { useSort, sortRows } from '../hooks/useSort';
import { getCustomerBadges, getInitials } from '../utils/customerBadges';
import { EmptyState, SearchBox } from '../core/widgets/parts';
import { FitList, toolbarBudget } from '../core/widgets/Fit';

// Densité selon la hauteur du widget : on retire d'abord les filtres, puis le tri, puis la recherche, pour laisser la place à la liste.
const CustomersListView = ({ config, size }) => {
  const { customerRows: rows } = useData();
  const { openCustomer, newCustomer, editCustomer } = useOverlays();
  const [term, setTerm] = useState('');
  const [sort, toggleSort] = useSort('total', 'desc');

  const filtered = useMemo(() => {
    const q = term.toLowerCase();
    return sortRows(
      rows.filter((c) => c.name.toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q)),
      sort,
      { name: (c) => c.name, count: (c) => c.count || 0, total: (c) => c.total || 0, last: (c) => c.last }
    );
  }, [rows, term, sort]);
  const take = toolbarBudget(size.measured ? size.height : 9999, 72 * 3) // au moins 3 clients visibles;
  const showTop = take(20 + 64); // marges du bloc + recherche / bouton
  const showCount = take(36);
  const showHeader = take(40);
  // Étroit, la ligne affiche aussi le total sous le nom (3 lignes) ; large, les colonnes le portent (2 lignes).
  const rowH = size.width < 640 ? 92 : 72;

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {showTop && (
      <div className="px-4 pt-2 pb-3 space-y-3 shrink-0">
        <div className="flex gap-2">
          <div className="flex-1 min-w-0"><SearchBox value={term} onChange={setTerm} placeholder="Nom ou email…" /></div>
          <button onClick={newCustomer} className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-pink-400 to-purple-500 rounded-xl shrink-0">
            <Plus size={16} /><span className="hidden @md:inline">Nouveau client</span><span className="@md:hidden">Nouveau</span>
          </button>
        </div>
        {showCount && (
        <p className="text-sm text-gray-500">
          <strong className="text-gray-900">{filtered.length}</strong> client{filtered.length > 1 ? 's' : ''}{term ? ` sur ${rows.length}` : ''}
        </p>
        )}
      </div>
      )}

      {showHeader && (
      <div className="flex items-center gap-3 @md:gap-4 px-4 py-2.5 bg-purple-50/60 border-y border-purple-100 shrink-0">
        <span className="w-9 shrink-0" />
        <div className="flex-1 min-w-0"><SortHeader label="Client" sortKey="name" sort={sort} onSort={toggleSort} /></div>
        <div className="hidden @lg:block w-24 shrink-0"><SortHeader label="Commandes" sortKey="count" firstDir="desc" sort={sort} onSort={toggleSort} /></div>
        <div className="@md:w-28 shrink-0 flex justify-end @md:justify-start"><SortHeader label="Total" sortKey="total" firstDir="desc" sort={sort} onSort={toggleSort} /></div>
        <div className="hidden @xl:block w-36 shrink-0"><SortHeader label="Dernière commande" sortKey="last" firstDir="desc" sort={sort} onSort={toggleSort} /></div>
        <span className="w-8 shrink-0" />
      </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Users}>Aucun client trouvé.</EmptyState>
      ) : (
        <FitList
          items={filtered}
          rowHeight={rowH}
          gap={0}
          padding=""
          padBottom={0}
          resetKey={`${term}|${sort.key}|${sort.dir}`}
          renderItem={(c) => {
            const badges = config.showBadges ? getCustomerBadges(c) : [];
            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => openCustomer(c.name)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCustomer(c.name); } }}
                style={{ height: rowH }}
                className="shrink-0 flex items-center gap-3 @md:gap-4 px-4 border-b border-purple-50 hover:bg-purple-25 cursor-pointer transition-colors overflow-hidden"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold shrink-0">{getInitials(c.name)}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{c.name}</p>
                  <p className="@md:hidden text-sm font-semibold text-gray-900 mt-0.5">{Number(c.total || 0).toFixed(2)}€ <span className="text-xs font-normal text-gray-400">· {c.count || 0} commande{(c.count || 0) > 1 ? 's' : ''}</span></p>
                  {badges.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-0.5 overflow-hidden">
                      {badges.map((b) => <span key={b.label} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 whitespace-nowrap">{b.icon} {b.label}</span>)}
                    </div>
                  )}
                  {c.email && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 min-w-0"><Mail size={12} className="shrink-0" /><span className="truncate">{c.email}</span></p>
                  )}
                </div>
                <p className="hidden @lg:block w-24 shrink-0 text-sm text-gray-700">{c.count || 0}</p>
                <p className="hidden @md:block @md:w-28 shrink-0 font-semibold text-gray-900 whitespace-nowrap">{Number(c.total || 0).toFixed(2)}€</p>
                <p className="hidden @xl:block w-36 shrink-0 text-sm text-gray-500">{c.last || '—'}</p>
                <button onClick={(e) => { e.stopPropagation(); editCustomer(c); }} aria-label={`Modifier ${c.name}`} className="p-2 -mr-2 text-gray-600 hover:bg-purple-50 rounded-lg shrink-0">
                  <Edit size={16} />
                </button>
              </div>
            );
          }}
        />
      )}
    </div>
  );
};

defineWidget({
  type: 'customers-list',
  title: 'Liste des clients',
  description: 'Tous vos clients avec leurs totaux, badges de fidélité, recherche et tri.',
  icon: Users,
  category: 'Clients',
  bleed: true,
  size: { w: 12, h: 22, minW: 4, minH: 8, maxW: 12, maxH: 44 },
  defaultConfig: { showBadges: true },
  schema: [{ key: 'showBadges', label: 'Badges de fidélité', type: 'toggle' }],
  component: CustomersListView,
});
