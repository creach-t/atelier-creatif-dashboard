import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarRange, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { PERIOD_OPTIONS, resolvePeriod, dayKey } from '../metrics/periods';
import { useData } from '../../data/DataProvider';
import { useWorkspace } from './WorkspaceProvider';
import { Sheet } from '../ui/Sheet';
import { useIsNarrow } from '../../hooks/useIsNarrow';
import { spring } from '../ui/motion';

const DATE_INPUT = 'w-full px-2.5 py-2 text-sm text-gray-800 bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 min-w-0';

const Arrow = ({ dir, onClick, disabled, label }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className="p-2 text-gray-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors"
  >
    {dir === 'prev' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
  </button>
);

// Période de la page : tous les widgets réglés sur « Suivre la page » la reprennent d'un coup.
// Un seul contrôle compact (flèches mois / année intégrées) ; un tap sur le libellé ouvre le panneau des
// préréglages, de l'année et de la plage libre — popover sur grand écran, feuille du bas sur mobile.
export const PeriodPicker = () => {
  const { orders } = useData();
  const { page, setPagePeriod, shiftMonth, shiftYear, setCustomRange } = useWorkspace();
  const narrow = useIsNarrow(767);
  const [open, setOpen] = useState(false);
  const resolved = resolvePeriod('page', page);

  const currentYear = new Date().getFullYear();
  const displayedYear = currentYear + Math.min(0, page.yearOffset || 0);
  // Année de la plus ancienne commande : borne des flèches (on ne navigue pas vers des années vides).
  const minYear = useMemo(() => {
    const years = orders.map((o) => Number((o.order_date || '').slice(0, 4))).filter(Boolean);
    return years.length ? Math.min(...years, currentYear) : currentYear;
  }, [orders, currentYear]);
  const hasOtherYears = minYear < currentYear;
  const minOffset = minYear - currentYear;

  const isMonth = page.period === 'month';
  const isYear = page.period === 'year' && hasOtherYears;
  const today = dayKey(new Date());

  useEffect(() => {
    if (!open || narrow) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, narrow]);

  const pick = (id) => { setPagePeriod(id); setOpen(false); };

  const stepYear = (delta) => {
    if (page.period !== 'year') setPagePeriod('year');
    shiftYear(delta, minOffset);
  };

  const openCustom = () => {
    if (page.period === 'custom') return;
    const r = page.rangeFrom && page.rangeTo ? { from: page.rangeFrom, to: page.rangeTo } : resolvePeriod('30d');
    setCustomRange(r.from, r.to);
  };

  const panel = (
    <div className="space-y-5">
      <section>
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Période</p>
        <div className="grid grid-cols-3 gap-1.5">
          {PERIOD_OPTIONS.filter((p) => p.id !== 'year').map((p) => {
            const active = page.period === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => pick(p.id)}
                aria-pressed={active}
                className={`px-2 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                  active ? 'bg-purple-500 border-purple-500 text-white shadow-sm' : 'bg-white border-purple-100 text-gray-600 hover:border-purple-300 hover:text-purple-700'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Année</p>
        <div className={`flex items-center justify-between rounded-xl border p-1 transition-colors ${page.period === 'year' ? 'border-purple-500 bg-purple-50' : 'border-purple-100 bg-white'}`}>
          {hasOtherYears ? (
            <Arrow dir="prev" label="Année précédente" onClick={() => stepYear(-1)} disabled={page.period === 'year' && displayedYear <= minYear} />
          ) : <span className="w-8" />}
          <button
            type="button"
            onClick={() => pick('year')}
            aria-pressed={page.period === 'year'}
            className="flex-1 py-1.5 text-sm font-semibold text-gray-800 rounded-lg hover:text-purple-700"
          >
            {page.period === 'year' ? displayedYear : currentYear}
          </button>
          {hasOtherYears ? (
            <Arrow dir="next" label="Année suivante" onClick={() => stepYear(1)} disabled={page.period !== 'year' || displayedYear >= currentYear} />
          ) : <span className="w-8" />}
        </div>
      </section>

      <section>
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Plage personnalisée</p>
        <div
          className={`grid grid-cols-2 gap-2 rounded-xl border p-2.5 transition-colors ${page.period === 'custom' ? 'border-purple-500 bg-purple-50' : 'border-purple-100 bg-white'}`}
          onFocusCapture={openCustom}
        >
          <label className="flex flex-col gap-1 text-[11px] font-semibold text-gray-500">
            Du
            <input
              type="date"
              className={DATE_INPUT}
              value={page.period === 'custom' ? page.rangeFrom || '' : ''}
              max={page.rangeTo || today}
              onChange={(e) => e.target.value && setCustomRange(e.target.value, page.rangeTo || e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-semibold text-gray-500">
            Au
            <input
              type="date"
              className={DATE_INPUT}
              value={page.period === 'custom' ? page.rangeTo || '' : ''}
              min={page.rangeFrom || undefined}
              max={today}
              onChange={(e) => e.target.value && setCustomRange(page.rangeFrom || e.target.value, e.target.value)}
            />
          </label>
        </div>
      </section>
    </div>
  );

  return (
    <div className="relative">
      <div className="inline-flex items-center bg-white border border-purple-100 rounded-xl shadow-sm">
        {isMonth && <Arrow dir="prev" label="Mois précédent" onClick={() => shiftMonth(-1)} />}
        {isYear && <Arrow dir="prev" label="Année précédente" onClick={() => shiftYear(-1, minOffset)} disabled={displayedYear <= minYear} />}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={`flex items-center gap-2 py-2 text-sm font-semibold text-gray-800 hover:text-purple-700 transition-colors ${isMonth || isYear ? 'px-1' : 'pl-3.5 pr-2.5'}`}
        >
          <CalendarRange size={16} className="text-purple-500 shrink-0" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={resolved.label}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.12 }}
              className="whitespace-nowrap min-w-[6.5rem] text-left"
            >
              {resolved.label}
            </motion.span>
          </AnimatePresence>
          <ChevronDown size={14} className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {isMonth && <Arrow dir="next" label="Mois suivant" onClick={() => shiftMonth(1)} disabled={(page.monthOffset || 0) >= 0} />}
        {isYear && <Arrow dir="next" label="Année suivante" onClick={() => shiftYear(1, minOffset)} disabled={displayedYear >= currentYear} />}
        {!isMonth && !isYear && <span className="w-1" />}
      </div>

      {narrow ? (
        <Sheet open={open} onClose={() => setOpen(false)} title="Période" subtitle={resolved.label}>{panel}</Sheet>
      ) : (
        <AnimatePresence>
          {open && (
            <>
              <button type="button" aria-label="Fermer" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
              <motion.div
                role="dialog"
                aria-label="Choisir la période"
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={spring}
                style={{ transformOrigin: 'top left' }}
                className="absolute left-0 top-full mt-2 z-50 w-[21rem] bg-white border border-purple-100 rounded-2xl shadow-2xl p-4"
              >
                {panel}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-pink-400 to-purple-500 rounded-xl"
                >
                  <Check size={16} /> Terminé
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};
