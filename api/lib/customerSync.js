// Crée automatiquement une fiche client quand une commande arrive pour un nom encore
// inconnu (webhook Ko-fi, import CSV, saisie manuelle point de vente). N'écrase jamais un nom/email
// déjà enregistré — seule exception : complète l'email si la fiche existante n'en a pas.
async function syncCustomerFromOrder(supabase, userId, { name, email }) {
  const cleanName = name && name.trim();
  if (!cleanName) return;

  const { data: existing, error: lookupError } = await supabase
    .from('customers')
    .select('id, email')
    .eq('user_id', userId)
    .eq('name', cleanName)
    .maybeSingle();

  if (lookupError) {
    console.error('customerSync lookup error:', lookupError);
    return;
  }

  if (!existing) {
    const { error: insertError } = await supabase.from('customers').insert({
      user_id: userId,
      name: cleanName,
      email: email || null,
    });
    if (insertError) console.error('customerSync insert error:', insertError);
    return;
  }

  if (!existing.email && email) {
    const { error: updateError } = await supabase.from('customers').update({ email }).eq('id', existing.id);
    if (updateError) console.error('customerSync enrich error:', updateError);
  }
}

module.exports = { syncCustomerFromOrder };
