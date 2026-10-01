import { useMemo } from 'react';
import { useData } from '../../data/DataProvider';
import { useWorkspace } from '../workspace/WorkspaceProvider';
import { resolvePeriod, ordersInPeriod, ordersInPrevPeriod } from '../metrics/periods';
import { isoDayNow } from './today';
import { isCounted } from '../../utils/orderAmounts';

// Période effective d'un widget : la sienne, ou celle de la page (« page »).
export function useWidgetPeriod(configPeriod = 'page') {
  const { page } = useWorkspace();
  const p = page || {};
  const today = isoDayNow();
  return useMemo(
    () => resolvePeriod(configPeriod, p, new Date(`${today}T12:00:00`)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configPeriod, p.period, p.monthOffset, p.yearOffset, p.rangeFrom, p.rangeTo, today]
  );
}

// Commandes d'un widget pour sa période (+ la période précédente pour les variations).
// Les commandes annulées sont écartées (revenus, graphiques, classements) ; les widgets qui listent les
// commandes ou leurs statuts passent `includeCancelled` pour les voir.
export function useWidgetOrders(configPeriod = 'page', { includeCancelled = false } = {}) {
  const { orders: every } = useData();
  const period = useWidgetPeriod(configPeriod);
  return useMemo(() => {
    const orders = includeCancelled ? every : every.filter(isCounted);
    return {
      period,
      allOrders: orders,
      orders: ordersInPeriod(orders, period),
      prevOrders: ordersInPrevPeriod(orders, period),
    };
  }, [every, period, includeCancelled]);
}
