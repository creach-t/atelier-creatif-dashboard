const crypto = require('crypto');
const { route, badRequest } = require('../lib/resource');
const { serverError } = require('../lib/errors');

// POST /api/products/image { contentType, data } -> 201 { url }
// Envoi d'une photo de produit vers Supabase Storage (bucket public « product-images », migration 0013). L'écriture
// passe par l'API (clé service role) : le navigateur ne peut pas écrire dans le stockage. Le front a déjà redimensionné
// l'image ; ici on borne la taille et on vérifie le VRAI type (octets d'en-tête), pas seulement celui déclaré.
const BUCKET = 'product-images';
const MAX_BYTES = 1024 * 1024; // 1 Mo après décodage (le front envoie ~100-300 Ko)

const TYPES = {
  'image/jpeg': { ext: 'jpg', matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: 'png', matches: (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  'image/webp': { ext: 'webp', matches: (b) => b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
};

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

module.exports = route({
  POST: async ({ res, user, supabase, body }) => {
    const type = TYPES[body.contentType];
    if (!type) return badRequest(res, 'contentType must be image/jpeg, image/png or image/webp');
    if (typeof body.data !== 'string' || body.data.length === 0 || body.data.length > Math.ceil((MAX_BYTES * 4) / 3) + 4 || !BASE64.test(body.data)) {
      return badRequest(res, 'data must be base64 (1 MB max)');
    }
    const bytes = Buffer.from(body.data, 'base64');
    if (bytes.length === 0 || bytes.length > MAX_BYTES) return badRequest(res, 'data must be base64 (1 MB max)');
    if (!type.matches(bytes)) return badRequest(res, 'file content does not match contentType');

    // Un dossier par utilisateur ; nom aléatoire (jamais celui du fichier envoyé).
    const path = `${user.id}/${crypto.randomUUID()}.${type.ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: body.contentType, cacheControl: '31536000', upsert: false });
    if (error) {
      // Bucket absent (migration 0013 pas encore passée) : fonction optionnelle indisponible, pas une panne.
      if (error.statusCode === '404' || error.status === 404 || /bucket not found/i.test(error.message || '')) {
        return res.status(501).json({ error: 'storage_unsupported' });
      }
      return serverError(res, error, 'POST /products/image');
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    res.status(201).json({ url: data.publicUrl });
  },
});
