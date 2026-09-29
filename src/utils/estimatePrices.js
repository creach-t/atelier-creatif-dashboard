// Estimation globale des prix produits inconnus à partir de TOUTES les commandes.
//
// Chaque commande donne une équation : Σ (quantité × prix) ≈ total. Les prix sûrs (catalogue
// saisi à la main, ou prix inscrit sur la ligne de commande) sont soustraits ; les inconnus sont
// résolus ensemble par moindres carrés sous contrainte prix ≥ 0. Les commandes à un seul produit
// inconnu ancrent directement le prix, celles à plusieurs produits se recoupent avec les autres.
//
// Prix libre ("prix fixe ou plus") et remises : le total s'écarte du prix théorique. On utilise
// donc une pondération robuste (type Cauchy, réévaluée à chaque itération) : une commande dont le
// total est aberrant pèse moins et ne tire pas le prix. Le résultat est un prix moyen pondéré
// par les quantités, recoupé sur l'ensemble des commandes.
import { extrasSum } from './orderAmounts';

const qtyOf = (i) => Number(i.quantity) || 1;
const ROBUST_SCALE = 0.4; // € d'écart à partir duquel une équation est fortement dépondérée
const RIDGE = 0.01; // poids du "rappel" vers l'estimation de départ (évite l'indétermination)
const FIT_TOLERANCE = 0.15; // € : une commande "colle" au prix estimé si l'écart est plus petit
const MIN_FITS = 2; // nombre minimum de commandes qui collent pour écrire le prix en base
const MIN_FIT_RATIO = 0.6; // part minimale des commandes concernées qui doivent coller
const SNAP_STEP = 0.5;
const SNAP_TOLERANCE = 0.12;

// Les prix affichés sont souvent ronds (4.00, 12.50) : on "accroche" l'estimation si elle est
// à moins de 12 centimes d'un demi-euro, sinon on garde le prix calculé tel quel.
const snap = (p) => {
  if (p < SNAP_TOLERANCE) return 0;
  const nearest = Math.round(p / SNAP_STEP) * SNAP_STEP;
  return Math.abs(nearest - p) <= SNAP_TOLERANCE && nearest > 0 ? nearest : Math.round(p * 100) / 100;
};

// Prix connus par nom de produit. Un produit gratuit (0 € confirmé par les commandes) y figure avec la
// valeur 0 : il est alors "connu" et n'absorbe pas le reste du total d'une commande.
export const catalogPrices = (products) =>
  Object.fromEntries(
    (products || [])
      .filter((p) => Number(p.price) > 0 || p.is_free || (p.price_estimated && Number(p.price) === 0))
      .map((p) => [p.name, Number(p.price)])
  );

export const estimatedNames = (products) =>
  new Set((products || []).filter((p) => p.price_estimated).map((p) => p.name));

export function estimatePrices(orders, products) {
  // Prix "sûrs" : saisis à la main. Un prix déjà estimé n'est PAS sûr, on le recalcule.
  const trusted = {};
  (products || []).forEach((p) => {
    if (p.is_free) trusted[p.name] = 0; // gratuit voulu : prix connu (0 €), jamais estimé
    else if (Number(p.price) > 0 && !p.price_estimated) trusted[p.name] = Number(p.price);
  });

  const equations = []; // { terms: { name: qty }, target, weight }
  const observations = {}; // prix inscrit directement sur une ligne de commande : name -> [{ price, weight }]

  (orders || []).forEach((order) => {
    if (order.status === 'cancelled') return;
    const items = (order.items || []).filter((i) => i && i.name);
    if (items.length === 0) return;

    let target = (Number(order.total) || 0) - extrasSum(order); // le divers n'est pas un article
    const terms = {};
    items.forEach((i) => {
      const q = qtyOf(i);
      const linePrice = Number(i.price) > 0 ? Number(i.price) : 0;
      if (linePrice > 0) {
        target -= q * linePrice;
        if (!(i.name in trusted)) (observations[i.name] = observations[i.name] || []).push({ price: linePrice, weight: q });
      } else if (i.name in trusted) {
        target -= q * trusted[i.name];
      } else {
        terms[i.name] = (terms[i.name] || 0) + q;
      }
    });

    // Reste nettement négatif : remise, l'équation n'apprend rien. Reste ~0 : les inconnus sont
    // gratuits (produit numérique offert seul ou dans un panier) — 0 € est un prix valide.
    if (Object.keys(terms).length === 0 || target < -FIT_TOLERANCE) return;
    equations.push({ terms, target: Math.max(0, target), weight: 1 });
  });

  const names = new Set();
  equations.forEach((e) => Object.keys(e.terms).forEach((n) => names.add(n)));
  Object.keys(observations).forEach((n) => names.add(n));
  const unknowns = [...names];
  if (unknowns.length === 0) return {};

  // Estimation de départ : moyenne pondérée des "reste / quantité" des équations qui le touchent.
  const start = {};
  unknowns.forEach((n) => {
    let num = 0;
    let den = 0;
    equations.forEach((e) => {
      if (!e.terms[n]) return;
      const totalQty = Object.values(e.terms).reduce((s, q) => s + q, 0);
      num += (e.target / totalQty) * e.terms[n];
      den += e.terms[n];
    });
    (observations[n] || []).forEach((o) => { num += o.price * o.weight; den += o.weight; });
    start[n] = den > 0 ? num / den : 0;
  });

  // Moindres carrés pondérés (Huber, réévalués), coordonnée par coordonnée, avec p >= 0.
  const price = { ...start };
  for (let round = 0; round < 60; round += 1) {
    const w = equations.map((e) => {
      const fit = Object.entries(e.terms).reduce((s, [n, q]) => s + q * price[n], 0);
      const z = (fit - e.target) / ROBUST_SCALE;
      return e.weight / (1 + z * z); // Cauchy : un pourboire ou une remise ne pèse presque plus
    });

    let moved = 0;
    unknowns.forEach((n) => {
      let num = RIDGE * start[n];
      let den = RIDGE;
      equations.forEach((e, k) => {
        const q = e.terms[n];
        if (!q) return;
        const others = Object.entries(e.terms).reduce((s, [m, qm]) => (m === n ? s : s + qm * price[m]), 0);
        num += w[k] * q * (e.target - others);
        den += w[k] * q * q;
      });
      (observations[n] || []).forEach((o) => { num += o.weight * o.price; den += o.weight; });
      const next = Math.max(0, num / den);
      moved = Math.max(moved, Math.abs(next - price[n]));
      price[n] = next;
    });
    if (moved < 1e-6) break;
  }

  // Vote de consensus : les moindres carrés donnent une bonne base, mais un prix fixe est un
  // "mode" (beaucoup de commandes au même montant) que pourboires et remises déplacent. Pour
  // chaque inconnu on teste les prix que suggèrent les commandes elles-mêmes et on garde celui
  // que le plus de commandes confirment (à 15 centimes près), les autres étant du bruit.
  // À égalité on prend le plus bas : prix libre = "prix fixe ou plus", jamais moins.
  const orderFits = (e, p) =>
    Math.abs(Object.entries(e.terms).reduce((s, [m, q]) => s + q * p[m], 0) - e.target) <= FIT_TOLERANCE;
  const othersOf = (e, n, p) => Object.entries(e.terms).reduce((s, [m, q]) => (m === n ? s : s + q * p[m]), 0);

  for (let pass = 0; pass < 5; pass += 1) {
    let changed = false;
    unknowns.forEach((n) => {
      const eqs = equations.filter((e) => e.terms[n]);
      const obs = observations[n] || [];
      if (eqs.length + obs.length === 0) return;

      const implied = eqs.map((e) => (e.target - othersOf(e, n, price)) / e.terms[n]).filter((c) => c >= 0);
      const candidates = [...new Set([price[n], ...implied, ...obs.map((o) => o.price)])];

      let best = null;
      candidates.forEach((c) => {
        const trial = { ...price, [n]: c };
        const fits = eqs.filter((e) => orderFits(e, trial)).length + obs.filter((o) => Math.abs(o.price - c) <= FIT_TOLERANCE).length;
        const better = !best || fits > best.fits || (fits === best.fits && c < best.c - 1e-9);
        if (better) best = { c, fits };
      });

      // Recentre sur la moyenne des commandes qui collent (au lieu d'une seule valeur).
      const cluster = [...implied, ...obs.map((o) => o.price)].filter((v) => Math.abs(v - best.c) <= FIT_TOLERANCE);
      const refined = cluster.length ? cluster.reduce((s, v) => s + v, 0) / cluster.length : best.c;
      if (Math.abs(refined - price[n]) > 1e-6) {
        price[n] = refined;
        changed = true;
      }
    });
    if (!changed) break;
  }

  // Identifiabilité : un prix n'est "sûr" que s'il est déterminé. Il l'est s'il apparaît seul dans une
  // commande (ou sur une ligne de commande), ou si tous les autres produits d'une commande le sont.
  // Deux produits toujours achetés ensemble, sans jamais l'un sans l'autre, ne peuvent pas être séparés.
  const identified = new Set(Object.keys(observations));
  const identifyOnePass = () => {
    let grew = false;
    equations.forEach((e) => {
      const open = Object.keys(e.terms).filter((m) => !identified.has(m));
      if (open.length === 1) {
        identified.add(open[0]);
        grew = true;
      }
    });
    return grew;
  };
  while (identifyOnePass());

  // Confiance : parmi les commandes qui touchent ce produit, combien "collent" au prix trouvé ?
  // Quasi sûr = identifiable + au moins MIN_FITS commandes qui collent + elles sont la nette majorité
  // (les autres sont des pourboires, remises ou paniers atypiques).
  //   sure     : >= 3 commandes concordantes et >= 75 % des commandes concernées
  //   probable : >= 2 commandes concordantes et >= 60 %
  //   weak     : le reste — affiché comme une piste "à confirmer", jamais écrit en base
  const finalPrice = {};
  unknowns.forEach((n) => { finalPrice[n] = snap(price[n]); });

  const result = {};
  unknowns.forEach((n) => {
    let support = 0;
    let fits = 0;
    equations.forEach((e) => {
      if (!e.terms[n]) return;
      support += 1;
      if (orderFits(e, finalPrice)) fits += 1;
    });
    (observations[n] || []).forEach((o) => {
      support += 1;
      if (Math.abs(o.price - finalPrice[n]) <= FIT_TOLERANCE) fits += 1;
    });
    const ratio = support ? fits / support : 0;
    const isIdentified = identified.has(n);
    const confident = isIdentified && fits >= MIN_FITS && ratio >= MIN_FIT_RATIO;
    result[n] = {
      price: finalPrice[n],
      orders: support,
      fits,
      identified: isIdentified,
      confident,
      level: !confident ? 'weak' : fits >= 3 && ratio >= 0.75 ? 'sure' : 'probable',
    };
  });
  return result;
}

// Applique les estimations aux produits pour l'affichage, sans attendre l'écriture en base.
//   - estimation quasi sûre : le produit reçoit ce prix (price_estimated = true, price_level, price_support)
//   - estimation faible : le prix n'est pas modifié, on expose juste price_guess ("à confirmer")
// Les prix saisis à la main (price > 0 et price_estimated faux) ne sont jamais touchés.
export function resolveProducts(products, estimates) {
  return (products || []).map((p) => {
    const estimable = !p.is_free && (!(Number(p.price) > 0) || p.price_estimated);
    const estimate = estimates[p.name];
    if (!estimable || !estimate) return p;
    if (estimate.confident) {
      return { ...p, price: estimate.price, price_estimated: true, price_level: estimate.level, price_support: estimate.orders };
    }
    return estimate.price > 0
      ? { ...p, price_guess: estimate.price, price_level: 'weak', price_support: estimate.orders }
      : p;
  });
}
