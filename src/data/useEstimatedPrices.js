import { useEffect, useRef } from 'react';

// Écrit en base le prix des produits sans prix défini, estimé globalement sur toutes les commandes
// (prix moyen pondéré, voir utils/estimatePrices) — uniquement quand il est quasi sûr. Le drapeau
// price_estimated permet de l'indiquer dans l'interface et de recalculer ces prix quand de nouvelles
// commandes arrivent ; un prix saisi à la main n'est jamais touché (le serveur remet price_estimated
// à false). L'affichage n'attend pas cette écriture : il utilise resolveProducts en direct.
export function useEstimatedPrices(products, estimates, updateProduct) {
  const pending = useRef(new Set());

  useEffect(() => {
    // Colonne absente (migration 0006 pas encore passée) : on ne fait rien plutôt que d'échouer.
    if (!products.length || !products.every((p) => 'price_estimated' in p)) return;

    products.forEach((product) => {
      const estimable = !product.is_free && (!(Number(product.price) > 0) || product.price_estimated);
      const estimate = estimates[product.name];
      if (!estimable || !estimate || !estimate.confident || pending.current.has(product.id)) return;
      if (product.price_estimated && Math.abs(Number(product.price) - estimate.price) < 0.005) return;

      pending.current.add(product.id);
      updateProduct(product.id, { price: estimate.price, price_estimated: true })
        .catch((err) => console.error('estimation de prix:', err))
        .finally(() => pending.current.delete(product.id));
    });
  }, [products, estimates, updateProduct]);
}
