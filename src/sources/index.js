// Adaptateurs d'import CSV par source. Ajouter une source importable : un fichier ici + `importAdapter` dans le registre.
import { etsyAdapter } from './etsy';

const ADAPTERS = { [etsyAdapter.id]: etsyAdapter };

export const getImportAdapter = (sourceId) => ADAPTERS[sourceId] || null;
