import { dayKey } from '../metrics/periods';

// Jour courant (YYYY-MM-DD) : sert de dépendance stable aux calculs de période.
export const isoDayNow = () => dayKey(new Date());
