import { SOURCES, SOURCE_IDS, getSource, hasCommission, defaultStatusFor, sourceLabel } from '../domain/sources';
import { CHANNEL_IDS } from '../domain/constants';
import { CHANNELS, channelStyle } from '../ui/ChannelBadge';
import { isSourceEnabled, rateFor, visibleSources, emptySettings } from '../utils/sourceSettings';
import { orderTotals, defaultCommissionFor, initialDraft } from '../features/orders/orderDraft';

const api = require('../../api/lib/sources');
const { CHANNELS: API_CHANNELS, validateOrderFields } = require('../../api/lib/validate');
const { isMissingSourcesMigration } = require('../../api/lib/errors');

describe('registre de sources', () => {
  test('les ids sont uniques, en minuscules et compatibles avec la contrainte SQL (migration 0012)', () => {
    expect(new Set(SOURCE_IDS).size).toBe(SOURCE_IDS.length);
    SOURCE_IDS.forEach((id) => expect(id).toMatch(/^[a-z][a-z0-9_]{1,31}$/));
  });

  test('chaque source a un libellé, un type, une teinte et un statut par défaut valides', () => {
    SOURCES.forEach((s) => {
      expect(s.label).toBeTruthy();
      expect(['webhook', 'import', 'manual']).toContain(s.kind);
      expect(['pending', 'shipped', 'delivered', 'cancelled']).toContain(s.defaultStatus);
      expect(channelStyle(s.id).hex).toMatch(/^#/);
      expect(CHANNELS[s.id].label).toBe(s.label);
      expect(['rate', 'none']).toContain(s.commission.mode);
    });
  });

  test('la copie CommonJS du serveur reste synchronisée avec celle du front', () => {
    expect(api.SOURCES.map((s) => s.id)).toEqual(SOURCE_IDS);
    api.SOURCES.forEach((back) => {
      const front = getSource(back.id);
      expect(back.label).toBe(front.label);
      expect(back.kind).toBe(front.kind);
      expect(back.defaultStatus).toBe(front.defaultStatus);
      expect(back.commission).toEqual(front.commission && { mode: front.commission.mode, defaultRate: front.commission.defaultRate });
      expect(back.importAdapter).toBe(front.importAdapter);
    });
    expect(API_CHANNELS).toEqual(SOURCE_IDS);
    expect(CHANNEL_IDS).toEqual(SOURCE_IDS);
  });

  test('non-régression Ko-fi / point de vente', () => {
    expect(defaultStatusFor('reel')).toBe('delivered');
    expect(defaultStatusFor('kofi')).toBe('pending');
    expect(hasCommission('reel')).toBe(true);
    expect(hasCommission('kofi')).toBe(false);
    expect(sourceLabel('reel')).toBe('Point de vente');
    expect(sourceLabel('inconnue')).toBe('inconnue');
  });
});

describe('validation API des canaux', () => {
  test('accepte toutes les sources du registre, refuse le reste', () => {
    SOURCE_IDS.forEach((id) => expect(validateOrderFields({ channel: id })).toBeNull());
    expect(validateOrderFields({ channel: 'amazon' })).toMatch(/channel must be one of/);
    expect(validateOrderFields({ channel: 'ETSY' })).toMatch(/channel must be one of/);
  });

  test('une migration 0012 manquante est reconnue (et pas une autre contrainte)', () => {
    expect(isMissingSourcesMigration({ code: '23514', message: 'violates check constraint "orders_channel_check"' })).toBe(true);
    expect(isMissingSourcesMigration({ code: 'PGRST204', message: "Could not find the 'source_ref' column" })).toBe(true);
    expect(isMissingSourcesMigration({ code: '23514', message: 'violates check constraint "orders_status_check"' })).toBe(false);
  });
});

describe('réglages de sources', () => {
  test('actives par défaut selon le registre, surchargeables', () => {
    const s = emptySettings();
    expect(isSourceEnabled(s, 'etsy')).toBe(true);
    expect(isSourceEnabled(s, 'depop')).toBe(false);
    expect(isSourceEnabled({ ...s, enabled: { depop: true, etsy: false } }, 'depop')).toBe(true);
    expect(isSourceEnabled({ ...s, enabled: { etsy: false } }, 'etsy')).toBe(false);
    expect(isSourceEnabled(s, 'inconnue')).toBe(false);
  });

  test('le taux par défaut vient des Réglages, sinon du registre, jamais hors 0-100', () => {
    expect(rateFor(emptySettings(), 'etsy')).toBe(getSource('etsy').commission.defaultRate);
    expect(rateFor({ enabled: {}, rates: { etsy: 12.5 } }, 'etsy')).toBe(12.5);
    expect(rateFor({ enabled: {}, rates: { etsy: 250 } }, 'etsy')).toBe(getSource('etsy').commission.defaultRate);
    expect(rateFor({ enabled: {}, rates: { kofi: 30 } }, 'kofi')).toBe(0); // pas de frais sur cette source
  });

  test('filtres : sources actives + sources déjà utilisées par des commandes', () => {
    const ids = (list) => list.map((s) => s.id);
    expect(ids(visibleSources(emptySettings(), []))).toEqual(['kofi', 'reel', 'etsy', 'vinted']);
    expect(ids(visibleSources(emptySettings(), [{ channel: 'depop' }]))).toContain('depop');
    expect(ids(visibleSources({ enabled: { etsy: false }, rates: {} }, [{ channel: 'etsy' }]))).toContain('etsy');
  });
});

describe('frais par source dans le brouillon de commande', () => {
  beforeEach(() => window.localStorage.clear());
  const draft = (channel, commission) => ({ channel, items: [{ quantity: 1, price: 20 }], extras: [], gap: 0, commission });

  test('Etsy déduit ses frais du net, Ko-fi jamais', () => {
    expect(orderTotals(draft('etsy', '10'))).toEqual({ total: 20, commissionRate: 10, commissionAmount: 2, net: 18 });
    expect(orderTotals(draft('kofi', '10')).commissionRate).toBe(0);
    expect(orderTotals(draft('vinted', '10')).commissionRate).toBe(0);
  });

  test('taux proposé : Réglages, ou dernier utilisé, vide sans frais', () => {
    const settings = { enabled: {}, rates: { etsy: 9 } };
    expect(defaultCommissionFor('etsy', settings)).toBe('9');
    expect(defaultCommissionFor('kofi', settings)).toBe('');
    expect(defaultCommissionFor('reel', emptySettings())).toBe('');
    window.localStorage.setItem('cashly.lastCommission', '30');
    expect(defaultCommissionFor('reel', emptySettings())).toBe('30');
    expect(initialDraft(null, [], emptySettings()).commission).toBe('30');
  });
});
