import { todayLocal } from '../../utils/dates';

// Jour courant (YYYY-MM-DD) : sert de dépendance stable aux calculs de période.
export const isoDayNow = () => todayLocal(); // jour de la vendeuse (Paris), comme les order_date
