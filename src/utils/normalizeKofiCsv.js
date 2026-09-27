// Le nom exact des colonnes du CSV Ko-fi n'est pas garanti (interface changeante) — on
// cherche par alias insensibles à la casse plutôt que par position fixe.
const HEADER_ALIASES = {
  timestamp: ['timestamp', 'date'],
  transaction_id: ['transaction id', 'transactionid', 'kofi transaction id', 'id'],
  type: ['type'],
  customer_name: ['from', 'name', 'supporter name', 'from name'],
  amount: ['amount', 'total'],
};

function findHeader(headers, aliases) {
  return headers.find((h) => aliases.includes(h.trim().toLowerCase()));
}

export function normalizeKofiCsvRows(rawRows) {
  if (!rawRows || rawRows.length === 0) return [];

  const headers = Object.keys(rawRows[0]);
  const mapping = {};
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    mapping[key] = findHeader(headers, aliases);
  }

  return rawRows.map((row) => ({
    timestamp: mapping.timestamp ? row[mapping.timestamp] : '',
    transaction_id: mapping.transaction_id ? row[mapping.transaction_id] : '',
    type: mapping.type ? row[mapping.type] : '',
    customer_name: mapping.customer_name ? row[mapping.customer_name] : '',
    amount: mapping.amount ? row[mapping.amount] : '0',
  }));
}
