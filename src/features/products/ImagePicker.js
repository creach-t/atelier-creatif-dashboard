import React, { useRef, useState } from 'react';
import { Link2, Image as ImageIcon, Upload, Smile, Loader2 } from 'lucide-react';
import { isHttpsUrl, isEmojiImage, isPhoto } from '../../utils/productImage';
import { parseKofiProductUrl } from '../../utils/kofiUrl';
import { fetchKofiPreview, uploadProductImage } from '../../services/productService';
import { describeKofiError } from './kofiSyncPlan';
import { resizeImage, ACCEPTED_TYPES } from './resizeImage';
import { DEFAULT_PRODUCT_IMAGE } from '../../domain/constants';
import { FIELD_CLASS } from '../../ui/fieldClasses';

const MODES = [
  { id: 'kofi', label: 'Lien Ko-fi', Icon: Link2 },
  { id: 'url', label: 'URL', Icon: ImageIcon },
  { id: 'file', label: 'Fichier', Icon: Upload },
  { id: 'emoji', label: 'Emoji', Icon: Smile },
];
const EMOJI_CHOICES = ['🎨', '🎁', '✨', '🧸', '📓', '🖼️', '🏷️', '🌸'];

const Preview = ({ image, onBroken, broken }) => {
  if (isPhoto(image) && !broken) {
    return <img src={image} alt="Aperçu de l'image" onError={onBroken} className="w-24 h-24 rounded-xl object-cover bg-purple-50 border border-purple-100" />;
  }
  return (
    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-purple-100 via-purple-50 to-pink-100 border border-purple-100 flex items-center justify-center text-4xl text-purple-300" aria-label="Aperçu de l'image">
      {isPhoto(image) ? <ImageIcon size={32} strokeWidth={1.5} /> : image || DEFAULT_PRODUCT_IMAGE}
    </div>
  );
};

// Image d'un produit : un aperçu immédiat et quatre façons de la choisir — lien Ko-fi (nom, prix et image récupérés
// par le parent via onKofiPreview), URL d'image, fichier (redimensionné puis envoyé), ou emoji.
// Valeur : toujours un emoji ou une URL https ; rien d'autre ne sort d'ici (voir utils/productImage).
export const ImagePicker = ({ image, kofiUrl, onChange, onKofiPreview }) => {
  const [mode, setMode] = useState('kofi');
  const [link, setLink] = useState(kofiUrl || '');
  const [urlDraft, setUrlDraft] = useState(isPhoto(image) ? image : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [broken, setBroken] = useState(false);
  const fileRef = useRef(null);

  const pick = (next) => { setError(null); setBroken(false); onChange(next); };

  const fetchLink = async () => {
    setError(null);
    if (!parseKofiProductUrl(link)) { setError(describeKofiError(new Error('invalid_kofi_url'))); return; }
    setBusy(true);
    try {
      onKofiPreview(await fetchKofiPreview(link.trim()));
    } catch (err) {
      setError(describeKofiError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleUrl = (value) => {
    setUrlDraft(value);
    if (!value.trim()) { setError(null); return; }
    if (!isHttpsUrl(value.trim())) { setError('Adresse invalide : https:// uniquement, 500 caractères max, sans identifiants.'); return; }
    pick(value.trim());
  };

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      pick(await uploadProductImage(await resizeImage(file)));
    } catch (err) {
      setError(describeKofiError(err));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleEmoji = (value) => {
    if (!value) { pick(DEFAULT_PRODUCT_IMAGE); return; }
    if (!isEmojiImage(value)) { setError('Un emoji uniquement (pas de lien ni de balise).'); return; }
    pick(value);
  };

  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-24">
        <Preview image={image} broken={broken} onBroken={() => setBroken(true)} />
        {(isPhoto(image) || (image && image !== DEFAULT_PRODUCT_IMAGE)) && (
          <button type="button" onClick={() => { setUrlDraft(''); pick(DEFAULT_PRODUCT_IMAGE); }} className="text-[11px] text-purple-600 hover:underline mt-1 w-full text-center">
            Retirer l’image
          </button>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div role="tablist" aria-label="Choisir l'image" className="grid grid-cols-4 gap-1 p-1 rounded-xl border border-purple-200 bg-white mb-2">
          {MODES.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => { setMode(id); setError(null); }}
              className={`px-1 py-1.5 text-[11px] font-medium rounded-lg flex flex-col items-center gap-0.5 transition-colors ${mode === id ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-purple-600'}`}
            >
              <Icon size={14} />{label}
            </button>
          ))}
        </div>

        {mode === 'kofi' && (
          <div className="flex gap-2">
            <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://ko-fi.com/s/…" aria-label="Lien du produit Ko-fi" className={`${FIELD_CLASS} min-w-0`} />
            <button type="button" onClick={fetchLink} disabled={busy || !link.trim()} className="px-3 py-2 text-sm font-medium rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50 shrink-0 flex items-center gap-1.5">
              {busy ? <Loader2 size={14} className="animate-spin" /> : null}{busy ? 'Lecture…' : 'Récupérer'}
            </button>
          </div>
        )}

        {mode === 'url' && (
          <input type="url" value={urlDraft} onChange={(e) => handleUrl(e.target.value)} placeholder="https://… (adresse d'une image)" aria-label="Adresse de l'image" className={FIELD_CLASS} />
        )}

        {mode === 'file' && (
          <label className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border border-dashed border-purple-300 text-sm text-purple-700 bg-purple-50/50 ${busy ? 'opacity-60' : 'cursor-pointer hover:bg-purple-50'}`}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {busy ? 'Envoi…' : 'Choisir une photo'}
            <input ref={fileRef} type="file" accept={ACCEPTED_TYPES.join(',')} onChange={handleFile} disabled={busy} aria-label="Fichier image" className="sr-only" />
          </label>
        )}

        {mode === 'emoji' && (
          <div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {EMOJI_CHOICES.map((e) => (
                <button key={e} type="button" onClick={() => pick(e)} aria-label={`Emoji ${e}`} className={`w-9 h-9 text-xl rounded-lg border ${image === e ? 'border-purple-400 bg-purple-50' : 'border-purple-100 hover:bg-purple-50'}`}>{e}</button>
              ))}
            </div>
            <input type="text" value={isPhoto(image) ? '' : image} onChange={(e) => handleEmoji(e.target.value)} maxLength={8} placeholder="ou colle un emoji" aria-label="Emoji" className={`${FIELD_CLASS} text-center text-xl`} />
          </div>
        )}

        {broken && <p className="text-xs text-amber-700 mt-2">Cette adresse ne s'affiche pas comme une image : vérifie-la avant d'enregistrer.</p>}
        {error && <p role="alert" className="text-xs text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  );
};
