const { createClient } = require('@supabase/supabase-js');

let client = null;

function getSupabaseClient() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      throw new Error(
        'Supabase is not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
      );
    }
    client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }
  return client;
}

module.exports = { getSupabaseClient };
