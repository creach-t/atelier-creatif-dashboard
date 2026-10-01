const { chunk } = require('./batch');

// Crée automatiquement une fiche client pour chaque nom encore inconnu (webhook Ko-fi, import CSV, saisie
// manuelle). N'écrase jamais un nom/email déjà enregistré — seule exception : complète l'email si la fiche
// existante n'en a pas.
// people : [{ name, email }] ; un même nom peut apparaître plusieurs fois, on garde le premier email renseigné.
// Requêtes groupées (un import peut compter des milliers de lignes) ; les erreurs sont loguées sans interrompre l'appelant.
async function syncCustomers(supabase, userId, people) {
  const byName = new Map();
  (people || []).forEach(({ name, email }) => {
    const cleanName = name && name.trim();
    if (!cleanName) return;
    if (!byName.has(cleanName) || (!byName.get(cleanName) && email)) byName.set(cleanName, email || null);
  });
  if (byName.size === 0) return;

  const existing = new Map();
  for (const names of chunk([...byName.keys()], 100)) {
    const { data, error } = await supabase.from('customers').select('id, name, email').eq('user_id', userId).in('name', names);
    if (error) {
      console.error('customerSync lookup error:', error);
      return;
    }
    data.forEach((c) => existing.set(c.name, c));
  }

  const missing = [...byName].filter(([name]) => !existing.has(name)).map(([name, email]) => ({ user_id: userId, name, email }));
  for (const rows of chunk(missing, 500)) {
    // Course possible avec une autre requête : le doublon est ignoré plutôt que de faire échouer tout le lot.
    const { error } = await supabase.from('customers').upsert(rows, { onConflict: 'user_id,name', ignoreDuplicates: true });
    if (error) console.error('customerSync insert error:', error);
  }

  for (const [name, email] of byName) {
    const customer = existing.get(name);
    if (!customer || customer.email || !email) continue;
    const { error } = await supabase.from('customers').update({ email }).eq('id', customer.id);
    if (error) console.error('customerSync enrich error:', error);
  }
}

const syncCustomerFromOrder = (supabase, userId, person) => syncCustomers(supabase, userId, [person]);

module.exports = { syncCustomers, syncCustomerFromOrder };
