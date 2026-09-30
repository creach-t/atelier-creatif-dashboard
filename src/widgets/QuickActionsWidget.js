import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ShoppingCart, Palette, Users } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';
import { useOverlays } from '../core/overlays/OverlayProvider';

const ACTIONS = {
  order: { label: 'Nouvelle commande', icon: ShoppingCart, run: (o) => o.newOrder(), tone: 'from-pink-400 to-purple-500 text-white' },
  product: { label: 'Nouveau produit', icon: Palette, run: (o) => o.newProduct(), tone: 'bg-purple-50 text-purple-700' },
  customer: { label: 'Nouveau client', icon: Users, run: (o) => o.newCustomer(), tone: 'bg-pink-50 text-pink-700' },
};

const QuickActionsView = ({ config }) => {
  const overlays = useOverlays();
  const shown = config.actions.filter((a) => ACTIONS[a]);
  return (
    <div className="flex-1 min-h-0 flex items-center">
      {/* Une seule rangée qui défile : les boutons ne se replient pas sur plusieurs lignes dans un bloc de hauteur fixe. */}
      <div className="flex gap-2 w-full overflow-x-auto no-scrollbar">
        {shown.map((key, i) => {
          const a = ACTIONS[key];
          const Icon = a.icon;
          return (
            <motion.button
              key={key}
              type="button"
              onClick={() => a.run(overlays)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.96 }}
              className={`flex-1 shrink-0 min-w-[10.5rem] whitespace-nowrap flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl ${a.tone.includes('from-') ? `bg-gradient-to-r shadow-md ${a.tone}` : a.tone}`}
            >
              <Icon size={16} /> {a.label}
            </motion.button>
          );
        })}
        {shown.length === 0 && <p className="text-sm text-gray-500">Choisissez des actions dans les réglages.</p>}
      </div>
    </div>
  );
};

defineWidget({
  type: 'quick-actions',
  title: 'Raccourcis',
  description: 'Des boutons pour créer une commande, un produit ou un client en un geste.',
  icon: Zap,
  category: 'Outils',
  size: { w: 12, h: 3, minW: 3, minH: 3, maxW: 12, maxH: 6 },
  defaultConfig: { actions: ['order', 'product', 'customer'], showTitle: false },
  schema: [{
    key: 'actions', label: 'Boutons affichés', type: 'multiselect',
    options: Object.entries(ACTIONS).map(([value, a]) => ({ value, label: a.label })),
  }],
  component: QuickActionsView,
});
