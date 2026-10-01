// Colonnes réelles du CSV Ko-fi (More > Transactions > Download CSV), vérifiées sur un
// vrai export le 2026-09-27 — ne pas re-deviner par alias, ces noms sont ceux de Ko-fi.
import { dayInParis } from './dates';

const PRODUCT_LINE = /^Product:\s*(\d+)\s*x\s*(.+)$/i;

// "09/08/2024 15:22" (MM/DD/YYYY HH:MM, en UTC) -> jour calendaire à Paris ("2024-09-08"),
// comme le webhook, pour qu'un même achat ait la même date quelle que soit sa source.
// Date illisible : chaîne vide (le serveur ignore la ligne et la compte) plutôt que « aujourd'hui », qui
// rangerait une vieille vente dans la mauvaise période.
function parseKofiDate(value) {
  const [datePart, timePart = '00:00'] = (value || '').trim().split(/\s+/);
  const [mm, dd, yyyy] = (datePart || '').split('/');
  const [hh = '0', min = '0'] = timePart.split(':');
  const utc = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min)));
  return mm && dd && yyyy && !Number.isNaN(utc.getTime()) ? dayInParis(utc) : '';
}

// "Product: 1 x Fond d'écran | Product: 2 x Sticker | " -> [{name, quantity}, ...]
// Pour les Tips/abonnements, la colonne Item vaut juste "Ko-fi Support" / "Nom de la page".
function parseKofiItems(itemField) {
  const raw = (itemField || '').trim();
  if (!raw) return [{ name: 'Support Ko-fi', quantity: 1 }];

  const segments = raw
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length === 0) return [{ name: raw, quantity: 1 }];

  return segments.map((seg) => {
    const match = seg.match(PRODUCT_LINE);
    if (match) return { name: match[2].trim(), quantity: Number(match[1]) || 1 };
    return { name: seg, quantity: 1 };
  });
}

export function normalizeKofiCsvRows(rawRows) {
  return rawRows
    .map((row) => {
      const received = parseFloat(row['Received']) || 0;
      const given = parseFloat(row['Given']) || 0;
      // "Given" = argent que TOI tu as payé (abonnement à une autre page, achat sur ta
      // propre boutique...) — ce n'est pas une vente, on l'exclut de l'import.
      const isOutgoing = received === 0 && given > 0;

      return {
        transaction_id: row['TransactionId'] || '',
        timestamp: parseKofiDate(row['DateTime (UTC)']),
        type: row['TransactionType'] || '',
        shopOrderType: row['ShopOrderType'] || '', // "Digital" | "Physical" | "" (dons/abonnements)
        customer_name: row['From'] || '',
        customer_email: row['BuyerEmail'] || '',
        amount: received,
        items: parseKofiItems(row['Item']),
        isOutgoing,
      };
    })
    .filter((row) => row.transaction_id);
}
