import React, { useMemo } from 'react';
import { dayKey } from '../../core/metrics/periods';
import { formatDate, plural } from '../../core/metrics/format';

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

// Couleur continue selon le nb de commandes du jour : un seul violet, vif dès la 1re commande,
// qui fonce jusqu'au record de la période. Jours vides = lavande très claire (pas de gris).
export const GAP = 4;
const DEFAULT_CELL = 16;
export const heatColor = (count, max) => {
  if (count === 0) return 'hsl(265, 70%, 97%)';
  const t = max <= 1 ? 1 : (count - 1) / (max - 1);
  return `hsl(${268 - t * 8}, ${88 - t * 6}%, ${68 - t * 38}%)`;
};

// Calendrier de chaleur : `weeksCount` semaines (lundi -> dimanche), une case par jour.
// `cell` = côté d'une case en px (calculé par le widget selon sa taille) ; `showStats` / `showLegend` se retirent
// quand le widget est court.
export const OrdersHeatmap = ({ orders, weeksCount = 26, selectedDay, onSelectDay, cell = DEFAULT_CELL, showStats = true, showLegend = true }) => {
  const CELL = cell;

  const { weeks, monthLabels, max, total, activeDays, best } = useMemo(() => {
    const counts = {};
    orders.forEach((o) => { if (o.order_date) counts[o.order_date] = (counts[o.order_date] || 0) + 1; });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - ((today.getDay() + 6) % 7) - (weeksCount - 1) * 7);

    const weekList = [];
    const labels = [];
    let maxCount = 0;
    let sum = 0;
    let active = 0;
    let bestDay = null;
    for (let w = 0; w < weeksCount; w += 1) {
      const days = [];
      for (let d = 0; d < 7; d += 1) {
        const date = new Date(start);
        date.setDate(start.getDate() + w * 7 + d);
        const key = dayKey(date);
        const future = date > today;
        const count = future ? 0 : counts[key] || 0;
        if (count > maxCount) { maxCount = count; bestDay = key; }
        sum += count;
        if (count > 0) active += 1;
        days.push({ key, date, count, future });
      }
      const prevMonth = w > 0 ? weekList[w - 1][0].date.getMonth() : -1;
      labels.push(days[0].date.getMonth() !== prevMonth ? MONTHS_FR[days[0].date.getMonth()] : '');
      weekList.push(days);
    }
    return { weeks: weekList, monthLabels: labels, max: maxCount, total: sum, activeDays: active, best: bestDay };
  }, [orders, weeksCount]);

  return (
    <div>
      {showStats && (
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 mb-3">
        <p className="text-xs text-gray-500">Plus la case est foncée, plus il y a eu de commandes ce jour-là</p>
        <div className="flex gap-5">
          <div>
            <p className="text-xl font-bold text-purple-700 leading-none">{total}</p>
            <p className="text-[11px] text-gray-500 mt-1">commande{total !== 1 ? 's' : ''}</p>
          </div>
          <div>
            <p className="text-xl font-bold text-purple-700 leading-none">{activeDays}</p>
            <p className="text-[11px] text-gray-500 mt-1">jour{activeDays !== 1 ? 's' : ''} actif{activeDays !== 1 ? 's' : ''}</p>
          </div>
          {best && (
            <div>
              <p className="text-xl font-bold text-purple-700 leading-none">{max}</p>
              <p className="text-[11px] text-gray-500 mt-1">record · {formatDate(best)}</p>
            </div>
          )}
        </div>
      </div>
      )}

      <div className="pb-1 pr-6">
        <div className="inline-flex" style={{ gap: GAP }}>
          <div className="flex flex-col mr-1 pt-[18px] text-[10px] text-gray-400" style={{ gap: GAP }}>
            {['Lun', '', 'Mer', '', 'Ven', '', ''].map((l, i) => (
              <span key={i} style={{ height: CELL, lineHeight: `${CELL}px` }}>{l}</span>
            ))}
          </div>
          {weeks.map((days, w) => (
            <div key={w} className="flex flex-col" style={{ gap: GAP }}>
              <span className="h-[14px] text-[10px] leading-[14px] text-gray-400 whitespace-nowrap">{weeksCount - w > Math.ceil(26 / (CELL + GAP)) ? monthLabels[w] : ''}</span>
              {days.map((day) => {
                const isBest = day.count > 0 && day.count === max && max > 1;
                return (
                  <button
                    key={day.key}
                    disabled={day.future || day.count === 0}
                    onClick={() => onSelectDay(selectedDay === day.key ? null : day.key)}
                    title={`${formatDate(day.key)} : ${plural(day.count, 'commande')}`}
                    aria-label={`${formatDate(day.key)} : ${plural(day.count, 'commande')}`}
                    style={{
                      width: CELL,
                      height: CELL,
                      background: day.future ? 'transparent' : heatColor(day.count, max),
                      boxShadow: isBest ? '0 0 8px 1px hsla(262, 80%, 45%, 0.55)' : undefined,
                    }}
                    className={`rounded-[5px] transition-transform ${
                      selectedDay === day.key ? 'ring-2 ring-pink-500 ring-offset-1 scale-110' : ''
                    } ${day.count > 0 ? 'hover:scale-125 hover:z-10 relative' : 'cursor-default'}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {showLegend && (
      <div className="flex items-center justify-end gap-2 mt-1 text-[10px] text-gray-400">
        1
        <span className="h-[10px] w-24 rounded-full" style={{ background: `linear-gradient(to right, ${heatColor(1, 2)}, ${heatColor(2, 2)})` }} />
        {max > 1 ? max : 'plus'}
      </div>
      )}
    </div>
  );
};
