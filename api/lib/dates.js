// Les dates de commande sont des jours calendaires (colonne `date`), pas des instants : elles
// doivent suivre le fuseau de la vendeuse. toISOString().slice(0, 10) donne le jour UTC, donc
// une vente à 00h30 heure de Paris serait datée de la veille.
const TIME_ZONE = 'Europe/Paris';

// 'en-CA' formate en YYYY-MM-DD.
const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function dayInParis(date) {
  return dayFormatter.format(date);
}

function todayInParis() {
  return dayInParis(new Date());
}

// Timestamp ISO (ex: Ko-fi "2026-01-15T10:30:00Z") -> jour calendaire à Paris, ou null si illisible.
function dayInParisFromTimestamp(timestamp) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : dayInParis(date);
}

module.exports = { dayInParis, todayInParis, dayInParisFromTimestamp };
