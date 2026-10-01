import { useMemo } from 'react';
import { useData } from '../../data/DataProvider';
import { useWorkspace } from '../workspace/WorkspaceProvider';
import { resolvePeriod, ordersInPeriod, ordersInPrevPeriod } from '../metrics/periods';
import { isoDayNow } from './today';

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
export function useWidgetOrders(configPeriod = 'page') {
  const { orders } = useData();
  const period = useWidgetPeriod(configPeriod);
  return useMemo(() => ({
    period,
    allOrders: orders,
    orders: ordersInPeriod(orders, period),
    prevOrders: ordersInPrevPeriod(orders, period),
  }), [orders, period]);
}
