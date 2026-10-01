// Redimensionne une photo choisie par l'utilisatrice avant envoi : côté le plus long ≤ 800 px, JPEG. Une photo de
// téléphone de 4 Mo devient ~100-200 Ko, bien en dessous de la limite de 1 Mo du serveur.
export const MAX_SIDE = 800;
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_INPUT_BYTES = 15 * 1024 * 1024; // on refuse d'ouvrir un fichier démesuré dans le navigateur

export function resizeImage(file, { maxSide = MAX_SIDE, quality = 0.85 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !ACCEPTED_TYPES.includes(file.type)) return reject(new Error('Format non pris en charge : JPEG, PNG ou WebP.'));
    if (file.size > MAX_INPUT_BYTES) return reject(new Error('Fichier trop volumineux (15 Mo max).'));

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; // un PNG transparent devient un JPEG sur fond blanc
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Impossible de préparer l'image."))), 'image/jpeg', quality);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image illisible.'));
    };
    img.src = url;
  });
}
