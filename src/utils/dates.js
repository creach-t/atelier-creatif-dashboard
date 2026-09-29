// Jour calendaire (YYYY-MM-DD) dans le fuseau de la vendeuse. toISOString().slice(0, 10) donne le
// jour UTC : une vente saisie à 00h30 heure de Paris serait datée de la veille.
const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const dayInParis = (date) => dayFormatter.format(date);

export const todayLocal = () => dayInParis(new Date());
