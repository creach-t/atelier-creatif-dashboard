import React, { useRef, useState } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { useData } from '../../data/DataProvider';
import { fetchKofiPreview } from '../../services/productService';
import { parseKofiProductUrl } from '../../utils/kofiUrl';
import { KofiChanges } from '../products/KofiChanges';
import { planKofiSync, defaultSelection, applyChanges, describeKofiError } from '../products/kofiSyncPlan';

const PAUSE_MS = 300; // ~3 requêtes / s : poli envers Ko-fi, et sous la limite de débit du serveur
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Rafraîchit le catalogue depuis Ko-fi : lit la page de chaque produit qui a un lien, PROPOSE les différences
// (nouvelle image, prix différent) et n'applique que ce qui est coché. Rien n'est écrasé en silence ; le bilan
// compte ce qui est mis à jour, laissé tel quel ou en échec.
export const CatalogRefreshCard = () => {
  const { products, updateProduct } = useData();
  const linked = products.filter((p) => parseKofiProductUrl(p.kofi_url));

  const [phase, setPhase] = useState('idle'); // idle | scanning | review | applying | done
  const [progress, setProgress] = useState(0);
  const [rows, setRows] = useState([]);
  const [report, setReport] = useState(null);
  const [fatal, setFatal] = useState(null);
  const cancelled = useRef(false);

  const scan = async () => {
    cancelled.current = false;
    setPhase('scanning');
    setFatal(null);
    setReport(null);
    setProgress(0);
    const found = [];
    const failed = [];
    let unchanged = 0;

    for (let i = 0; i < linked.length; i += 1) {
      if (cancelled.current) break;
      const product = linked[i];
      try {
        const preview = await fetchKofiPreview(product.kofi_url);
        const changes = planKofiSync(product, preview);
        if (changes.length === 0) unchanged += 1;
        else found.push({ product, changes, selected: defaultSelection(changes) });
      } catch (err) {
        failed.push({ name: product.name, reason: describeKofiError(err) });
        // Ko-fi bloque les requêtes du serveur : inutile d'insister produit après produit.
        if (err.message === 'kofi_blocked' || err.message === 'Too many requests') {
          setFatal(describeKofiError(err));
          break;
        }
      }
      setProgress(i + 1);
      await sleep(PAUSE_MS);
    }

    setRows(found);
    setReport({ unchanged, failed, updated: 0, left: 0, updateFailed: [] });
    setPhase(found.length > 0 ? 'review' : 'done');
  };

  const toggle = (index, field) => setRows((list) => list.map((row, i) => {
    if (i !== index) return row;
    const selected = new Set(row.selected);
    if (selected.has(field)) selected.delete(field); else selected.add(field);
    return { ...row, selected };
  }));

  const apply = async () => {
    setPhase('applying');
    let updated = 0;
    let left = 0;
    const updateFailed = [];
    for (const row of rows) {
      if (row.selected.size === 0) { left += 1; continue; }
      try {
        await updateProduct(row.product.id, applyChanges(row.changes, row.selected, row.product));
        updated += 1;
      } catch (err) {
        updateFailed.push({ name: row.product.name, reason: err.message || 'Échec de la mise à jour.' });
      }
    }
    setReport((r) => ({ ...r, updated, left, updateFailed }));
    setRows([]);
    setPhase('done');
  };

  const reset = () => { setPhase('idle'); setRows([]); setReport(null); setFatal(null); };
  const selectedCount = rows.reduce((n, r) => n + r.selected.size, 0);

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Rafraîchir le catalogue depuis Ko-fi</h3>
      <p className="text-sm text-gray-600 mb-4">
        Relit la page Ko-fi de chaque produit qui a un lien ({linked.length} produit{linked.length > 1 ? 's' : ''}) et te propose les
        nouvelles images et les prix différents. Rien n'est modifié sans ta validation, et un prix ou une photo déjà présents
        ne sont remplacés que si tu les coches.
      </p>

      {phase === 'idle' && (
        <Button onClick={scan} disabled={linked.length === 0} size="sm">
          <RefreshCw size={15} /> Vérifier les produits
        </Button>
      )}

      {phase === 'scanning' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-700 flex items-center gap-2" role="status">
            <Loader2 size={15} className="animate-spin" /> Lecture de Ko-fi… {progress} / {linked.length}
          </p>
          <div className="h-1.5 bg-purple-50 rounded-full overflow-hidden">
            <div className="h-full bg-purple-400 transition-all" style={{ width: `${linked.length ? (progress / linked.length) * 100 : 0}%` }} />
          </div>
          <Button variant="secondary" size="sm" onClick={() => { cancelled.current = true; }}>Arrêter</Button>
        </div>
      )}

      {fatal && <p role="alert" className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3">{fatal}</p>}

      {phase === 'review' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">{rows.length}</span> produit{rows.length > 1 ? 's' : ''} avec des différences. Coche ce que tu veux appliquer.
          </p>
          <ul className="space-y-4">
            {rows.map((row, i) => (
              <li key={row.product.id}>
                <p className="text-sm font-semibold text-gray-900 mb-2 break-words">{row.product.name}</p>
                <KofiChanges changes={row.changes} selected={row.selected} onToggle={(field) => toggle(i, field)} />
              </li>
            ))}
          </ul>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={apply} disabled={selectedCount === 0} size="sm">Appliquer {selectedCount} modification{selectedCount > 1 ? 's' : ''}</Button>
            <Button variant="secondary" onClick={reset} size="sm">Annuler</Button>
          </div>
        </div>
      )}

      {phase === 'applying' && <p className="text-sm text-gray-700 flex items-center gap-2" role="status"><Loader2 size={15} className="animate-spin" /> Mise à jour…</p>}

      {phase === 'done' && report && (
        <div className="space-y-3">
          <ul className="text-sm text-gray-700 space-y-1" aria-label="Bilan">
            <li><span className="font-semibold text-green-700">{report.updated}</span> produit(s) mis à jour</li>
            <li><span className="font-semibold">{report.unchanged + report.left}</span> ignoré(s) ou déjà à jour</li>
            <li><span className={`font-semibold ${report.failed.length + report.updateFailed.length ? 'text-red-600' : ''}`}>{report.failed.length + report.updateFailed.length}</span> en échec</li>
          </ul>
          {[...report.failed, ...report.updateFailed].length > 0 && (
            <details className="text-xs text-gray-600">
              <summary className="cursor-pointer">Détail des échecs</summary>
              <ul className="mt-1 space-y-0.5">
                {[...report.failed, ...report.updateFailed].slice(0, 50).map((f, i) => <li key={i}><span className="font-medium">{f.name}</span> : {f.reason}</li>)}
              </ul>
            </details>
          )}
          <Button variant="secondary" onClick={reset} size="sm">Recommencer</Button>
        </div>
      )}
    </Card>
  );
};
