import React from 'react';
import { motion } from 'framer-motion';
import { ProductCover } from '../ui/ProductThumbnail';
import { AnimatedNumber } from '../../core/ui/AnimatedNumber';
import { softSpring } from '../../core/ui/motion';
import { FitList } from '../../core/widgets/Fit';
import { ScaleToFit } from '../../core/widgets/ScaleToFit';

// Hauteur fixe d'une ligne du classement : la pagination calcule combien tiennent dans le widget.
const REST_ROW_H = 52;

// Podium large : hauteur du bloc texte d'une carte, et bornes de la photo (plafond, et seuil sous lequel on passe en liste).
const CARD_TEXT_H = 142;
const PHOTO_MAX_H = 176;
const PHOTO_MIN_H = 84;

const PodiumWrap = ({ scale, children }) => (scale ? <ScaleToFit>{children}</ScaleToFit> : <div className="shrink-0">{children}</div>);

const money = (n) => `${Number(n || 0).toFixed(2)}€`;
const soldText = (n) => `${n} vendu${n > 1 ? 's' : ''}`;

// Médaille et teinte par rang : on lit le classement avant même les chiffres.
const MEDALS = [
  { emoji: '🥇', card: 'from-amber-50 via-white to-white border-amber-200', bar: 'bg-amber-400', ring: 'ring-2 ring-amber-200' },
  { emoji: '🥈', card: 'from-slate-50 via-white to-white border-slate-200', bar: 'bg-slate-400', ring: '' },
  { emoji: '🥉', card: 'from-orange-50 via-white to-white border-orange-200', bar: 'bg-orange-400', ring: '' },
];
const GRID = { 1: 'grid-cols-1', 2: 'grid-cols-1 @md:grid-cols-2', 3: 'grid-cols-1 @md:grid-cols-3' };

const Bar = ({ pct, className, delay = 0 }) => (
  <div className="h-1.5 rounded-full bg-white/80 ring-1 ring-black/5 overflow-hidden">
    <motion.div
      className={`h-full rounded-full ${className}`}
      initial={{ width: 0 }}
      animate={{ width: `${Math.max(pct, 4)}%` }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    />
  </div>
);

// Carte du podium : pochette du produit, médaille, valeur qui défile, part du meilleur en barre animée.
// Étroite : photo à gauche ; large (widget ≥ 640 px) : les trois cartes côte à côte, photo au-dessus.
const PodiumCard = ({ item, rank, max, totalRevenue, by, onView, single }) => {
  const m = MEDALS[rank];
  const value = by === 'sold' ? item.sold : item.revenue;
  const share = totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0;
  const layout = single ? 'flex-row' : 'flex-row @md:flex-col @md:items-stretch';
  const photo = single ? 'w-24 @md:w-44' : 'w-20 @md:w-full';

  return (
    <motion.button
      type="button"
      onClick={() => onView(item.group.variants[0].product.name)}
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...softSpring, delay: rank * 0.09 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      className={`group relative flex ${layout} items-center gap-3 text-left rounded-2xl border bg-gradient-to-br p-2.5 @md:p-3 shadow-sm hover:shadow-lg transition-shadow overflow-hidden ${m.card} ${m.ring}`}
    >
      <div className={`relative shrink-0 ${photo}`}>
        <ProductCover image={item.group.image} rounded="rounded-xl" aspect={single ? 'aspect-square' : 'aspect-square @md:aspect-[16/9]'} className={`group-hover:shadow-md ${single ? '' : '@md:max-h-44'}`} />
        <motion.span
          aria-hidden="true"
          className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-white/95 shadow flex items-center justify-center text-base"
          initial={{ scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.25 + rank * 0.09 }}
        >
          {m.emoji}
        </motion.span>
      </div>

      <div className="min-w-0 flex-1 w-full">
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{item.group.name}</p>
        <p className="mt-1 text-xl @md:text-2xl font-bold text-gray-900 leading-none">
          <AnimatedNumber value={value} format={by === 'sold' ? (n) => soldText(Math.round(n)) : money} />
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {by === 'sold' ? money(item.revenue) : soldText(item.sold)}
          {share > 0 && totalRevenue > 0 && by !== 'sold' && <span className="text-gray-400"> · {share} % du revenu</span>}
        </p>
        <div className="mt-2"><Bar pct={max > 0 ? (value / max) * 100 : 0} className={m.bar} delay={0.3 + rank * 0.09} /></div>
      </div>
    </motion.button>
  );
};

// Suite du classement (rang 4 et plus) : lignes compactes.
const RestRow = ({ item, rank, max, by, onView, medal = false }) => {
  const value = by === 'sold' ? item.sold : item.revenue;
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + (rank % 8) * 0.04 }} style={{ height: REST_ROW_H }} className="shrink-0">
      <button
        type="button"
        onClick={() => onView(item.group.variants[0].product.name)}
        className="w-full h-full flex items-center gap-3 px-2.5 text-left rounded-xl hover:bg-purple-50 transition-colors"
      >
        <span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${medal && MEDALS[rank] ? 'text-base' : 'bg-purple-100 text-purple-700'}`}>{medal && MEDALS[rank] ? MEDALS[rank].emoji : rank + 1}</span>
        <span className="w-9 shrink-0"><ProductCover image={item.group.image} rounded="rounded-lg" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-gray-900 truncate">{item.group.name}</span>
          <span className="block mt-1"><Bar pct={max > 0 ? (value / max) * 100 : 0} className="bg-purple-300" delay={0.4} /></span>
        </span>
        <span className="text-right shrink-0">
          <span className="block text-sm font-bold text-gray-900 whitespace-nowrap">{by === 'sold' ? soldText(item.sold) : money(item.revenue)}</span>
          <span className="block text-[11px] text-gray-400 whitespace-nowrap">{by === 'sold' ? money(item.revenue) : soldText(item.sold)}</span>
        </span>
      </button>
    </motion.div>
  );
};

// Podium des produits : les trois premiers en cartes avec pochette et médaille, les suivants en liste.
// Conçu pour rester encourageant : un seul produit = « premier best-seller », un petit chiffre d'affaires =
// une phrase positive, jamais un classement qui a l'air vide.
// items : [{ group, sold, revenue }] triés ; totalRevenue : revenu de tous les produits.
export const TopProducts = ({ items, totalRevenue, onView, by = 'revenue', width = 0, height = 0 }) => {
  if (items.length === 0) return null;
  const value = (t) => (by === 'sold' ? t.sold : t.revenue);
  // Podium tant qu'il y a la place de le déployer ; sinon liste compacte (médailles conservées). Hauteur
  // nécessaire : cartes côte à côte en large (~330 px), ou empilées en étroit (~115 px par carte).
  const wide = width >= 640;
  const count = Math.min(3, items.length);
  const cardW = wide ? (width - 24 - (count - 1) * 12) / count : 0;
  const reserve = items.length > 4 ? 100 : items.length > 3 ? 60 : 0; // place pour la suite du classement
  let asPodium;
  let shrunkCardW = null; // largeur (px) imposée aux cartes quand la hauteur manque
  if (wide) {
    // Les cartes gardent leur aspect : si la hauteur manque, elles s'ÉTRÉCISSENT (la photo, en 16/9, rétrécit avec
    // elles) jusqu'à un seuil de remplissage — photo de 84 px, carte d'environ 150 px. En dessous : liste compacte.
    const naturalImg = Math.min(PHOTO_MAX_H, cardW * (9 / 16));
    const availImg = height ? height - 44 - 16 - reserve - CARD_TEXT_H : Infinity;
    const img = Math.min(naturalImg, availImg);
    asPodium = !height || img >= PHOTO_MIN_H;
    if (asPodium && img < naturalImg) shrunkCardW = Math.round(img * (16 / 9)) + 24; // photo + marges de la carte
  } else {
    // Étroit : cartes empilées, photo à gauche (hauteur fixe) — on ne peut pas les étrécir en hauteur.
    asPodium = !height || height >= 44 + 115 * count + (count - 1) * 12 + 16 + reserve;
  }
  const podium = asPodium ? items.slice(0, 3) : [];
  const rest = asPodium ? items.slice(3) : items;
  const max = value(items[0]) || 1;
  const topSum = items.reduce((s, t) => s + t.revenue, 0);
  const sharePct = totalRevenue > 0 ? Math.round((topSum / totalRevenue) * 100) : 0;

  const small = totalRevenue > 0 && totalRevenue < 150;
  const message = items.length === 1
    ? '🌱 Votre premier best-seller — chaque vente compte !'
    : small
      ? '✨ Belle base pour démarrer : continuez comme ça !'
      : null;

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {asPodium && (
        // Sans suite de classement, le podium occupe toute la hauteur : s'il y manque encore un peu de place, il est réduit.
        <PodiumWrap scale={rest.length === 0}>
        <div className="p-3 pb-2 space-y-3">
          {(message || (sharePct > 0 && items.length > 1)) && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-xs px-3 py-2 rounded-xl ${message ? 'bg-purple-50 text-purple-700 font-semibold' : 'bg-gray-50 text-gray-500'}`}
            >
              {message || <>Ces {items.length} produits représentent <span className="font-bold text-gray-900">{sharePct} %</span> du revenu des produits</>}
            </motion.p>
          )}
          <div
            className={`grid gap-3 ${shrunkCardW ? '' : GRID[podium.length]}`}
            style={shrunkCardW ? { gridTemplateColumns: `repeat(${podium.length}, ${shrunkCardW}px)`, justifyContent: 'center' } : undefined}
          >
            {podium.map((item, i) => (
              <PodiumCard key={item.group.key} item={item} rank={i} max={max} totalRevenue={totalRevenue} by={by} onView={onView} single={podium.length === 1} />
            ))}
          </div>
        </div>
        </PodiumWrap>
      )}

      {rest.length > 0 && (
        <FitList
          items={rest}
          rowHeight={REST_ROW_H}
          gap={2}
          padding="px-3"
          resetKey={`${by}|${asPodium}|${items.length}`}
          renderItem={(item, _i, index) => (
            <RestRow key={item.group.key} item={item} rank={asPodium ? index + 3 : index} max={max} by={by} onView={onView} medal={!asPodium} />
          )}
        />
      )}
    </div>
  );
};
