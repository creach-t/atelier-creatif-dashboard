import React, { useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarRange } from 'lucide-react';
import { PAGE_PERIOD_OPTIONS, resolvePeriod, dayKey } from '../metrics/periods';
import { useData } from '../data/DataProvider';
import { useWorkspace } from './WorkspaceProvider';
import { spring } from '../ui/motion';

const ArrowGroup = ({ label, onPrev, onNext, prevDisabled, nextDisabled, prevLabel, nextLabel }) => (
  <div className="flex items-center gap-0.5 bg-white border border-purple-100 rounded-xl p-1 shrink-0">
    <button onClick={onPrev} disabled={prevDisabled} className="p-1.5 text-gray-500 hover:bg-purple-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent" aria-label={prevLabel}>
      <ChevronLeft size={16} />
    </button>
    <span className="hidden 2xl:block text-xs font-semibold text-gray-700 min-w-[7.5rem] text-center">{label}</span>
    <button onClick={onNext} disabled={nextDisabled} className="p-1.5 text-gray-500 hover:bg-purple-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent" aria-label={nextLabel}>
      <ChevronRight size={16} />
    </button>
  </div>
);

const DATE_INPUT = 'w-full px-2.5 py-1.5 text-sm normal-case font-normal text-gray-800 bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 min-w-0';

// Période de la page : tous les widgets réglés sur « Suivre la page » la reprennent d'un coup.
// Mois et année se parcourent avec des flèches ; l'année n'est navigable que s'il existe d'autres années
// de commandes ; « Personnalisé » ouvre deux champs de date pour une plage libre.
export const PeriodPicker = () => {
  const { orders } = useData();
  const { page, setPagePeriod, shiftMonth, shiftYear, setCustomRange } = useWorkspace();
  const resolved = resolvePeriod('page', page);
  const listRef = useRef(null);

  const currentYear = new Date().getFullYear();
  const displayedYear = currentYear + Math.min(0, page.yearOffset || 0);
  // Année de la plus ancienne commande : borne des flèches (on ne navigue pas vers des années vides).
  const minYear = useMemo(() => {
    const years = orders.map((o) => Number((o.order_date || '').slice(0, 4))).filter(Boolean);
    return years.length ? Math.min(...years, currentYear) : currentYear;
  }, [orders, currentYear]);
  const hasOtherYears = minYear < currentYear;
  const minOffset = minYear - currentYear;

  // La période active reste visible même quand la rangée défile (mobile).
  useEffect(() => {
    const el = listRef.current && listRef.current.querySelector('[aria-pressed="true"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [page.period, page.id]);

  const choose = (id) => {
    if (id === 'custom') {
      // Première ouverture : on part des 30 derniers jours, immédiatement modifiables.
      if (!page.rangeFrom || !page.rangeTo) {
        const r = resolvePeriod('30d');
        setCustomRange(r.from, r.to);
      } else {
        setCustomRange(page.rangeFrom, page.rangeTo);
      }
      return;
    }
    setPagePeriod(id);
  };

  const labelOf = (p) => {
    if (p.id === 'year') return String(page.period === 'year' ? displayedYear : currentYear);
    if (p.id === 'custom' && page.period === 'custom') return resolved.label;
    // Mois autre que le courant : le chip nomme le mois affiché (les flèches n'ont plus d'étiquette hors très grand écran).
    if (p.id === 'month' && page.period === 'month' && (page.monthOffset || 0) < 0) return resolved.label;
    return p.label;
  };

  const today = dayKey(new Date());

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center gap-2 min-w-0">
        <div ref={listRef} className="flex gap-1 p-1 bg-white border border-purple-100 rounded-xl overflow-x-auto no-scrollbar min-w-0">
          {PAGE_PERIOD_OPTIONS.map((p) => {
            const active = page.period === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => choose(p.id)}
                aria-pressed={active}
                className={`relative px-2.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors inline-flex items-center gap-1.5 ${active ? 'text-purple-700' : 'text-gray-500 hover:text-purple-600'}`}
              >
                {active && <motion.span layoutId="period-pill" transition={spring} className="absolute inset-0 rounded-lg bg-purple-100" />}
                {p.id === 'custom' && <CalendarRange size={13} className="relative" />}
                <span className="relative">{labelOf(p)}</span>
              </button>
            );
          })}
        </div>

        {page.period === 'month' && (
          <ArrowGroup
            label={resolved.label}
            onPrev={() => shiftMonth(-1)}
            onNext={() => shiftMonth(1)}
            nextDisabled={(page.monthOffset || 0) >= 0}
            prevLabel="Mois précédent"
            nextLabel="Mois suivant"
          />
        )}
        {page.period === 'year' && hasOtherYears && (
          <ArrowGroup
            label={`Année ${displayedYear}`}
            onPrev={() => shiftYear(-1, minOffset)}
            onNext={() => shiftYear(1, minOffset)}
            prevDisabled={displayedYear <= minYear}
            nextDisabled={displayedYear >= currentYear}
            prevLabel="Année précédente"
            nextLabel="Année suivante"
          />
        )}
      </div>

      <AnimatePresence initial={false}>
        {page.period === 'custom' && (
          <motion.div
            key="range"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 bg-white border border-purple-100 rounded-xl px-3 py-2">
              <label className="flex-1 min-w-0 flex flex-col gap-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                Du
                <input
                  type="date"
                  className={DATE_INPUT}
                  value={page.rangeFrom || ''}
                  max={page.rangeTo || today}
                  onChange={(e) => e.target.value && setCustomRange(e.target.value, page.rangeTo || e.target.value)}
                />
              </label>
              <label className="flex-1 min-w-0 flex flex-col gap-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                Au
                <input
                  type="date"
                  className={DATE_INPUT}
                  value={page.rangeTo || ''}
                  min={page.rangeFrom || undefined}
                  max={today}
                  onChange={(e) => e.target.value && setCustomRange(page.rangeFrom || e.target.value, e.target.value)}
                />
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
