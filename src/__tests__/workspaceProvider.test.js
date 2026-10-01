import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { WorkspaceProvider, useWorkspace } from '../core/workspace/WorkspaceProvider';
import { createPage } from '../core/workspace/model';
import { loadLocal, saveLocal, clearLocal, loadRemote, saveRemote } from '../core/workspace/storage';

jest.mock('../core/workspace/storage', () => ({
  loadLocal: jest.fn(), saveLocal: jest.fn(), clearLocal: jest.fn(), loadRemote: jest.fn(), saveRemote: jest.fn(),
}));

const wrapper = ({ children }) => <WorkspaceProvider>{children}</WorkspaceProvider>;

// Monte le fournisseur et laisse la fusion avec la version serveur se terminer.
async function setup() {
  const view = renderHook(() => useWorkspace(), { wrapper });
  await act(() => loadRemote.mock.results[0].value);
  return view;
}

beforeEach(() => {
  jest.useFakeTimers();
  window.location.hash = '';
  loadLocal.mockReturnValue(null);
  loadRemote.mockResolvedValue(null);
  saveRemote.mockResolvedValue(true);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('WorkspaceProvider', () => {
  test("démarre sur les pages par défaut, première page active, rien à annuler", async () => {
    const { result } = await setup();
    expect(result.current.pages.length).toBeGreaterThan(0);
    expect(result.current.page.id).toBe(result.current.pages[0].id);
    expect(result.current.canUndo).toBe(false);
  });

  test("un espace jamais modifié n'est écrit nulle part", async () => {
    await setup();
    act(() => { jest.advanceTimersByTime(5000); });
    expect(saveLocal).not.toHaveBeenCalled();
    expect(saveRemote).not.toHaveBeenCalled();
  });

  test('ajouter une page : navigue dessus, puis annuler la retire', async () => {
    const { result } = await setup();
    const before = result.current.pages.length;

    act(() => { result.current.addPage('Ma page'); });
    expect(result.current.pages).toHaveLength(before + 1);
    expect(result.current.page.title).toBe('Ma page');
    expect(result.current.canUndo).toBe(true);

    act(() => { result.current.undo(); });
    expect(result.current.pages).toHaveLength(before);
    expect(result.current.canUndo).toBe(false);
  });

  test("un changement sans effet n'entre pas dans l'historique", async () => {
    const { result } = await setup();
    act(() => { result.current.shiftMonth(1); }); // déjà au mois courant : impossible d'aller dans le futur
    expect(result.current.canUndo).toBe(false);
  });

  test('sauvegarde locale tout de suite, serveur en différé (une seule fois pour une rafale)', async () => {
    const { result } = await setup();
    act(() => { result.current.addPage('A'); });
    act(() => { result.current.addPage('B'); });
    expect(saveLocal).toHaveBeenCalled();
    expect(saveRemote).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(1300); });
    expect(saveRemote).toHaveBeenCalledTimes(1);
    expect(saveRemote.mock.calls[0][0].pages.map((p) => p.title)).toEqual(expect.arrayContaining(['A', 'B']));
  });

  test("la version serveur plus récente (autre appareil) l'emporte", async () => {
    loadRemote.mockResolvedValue({ version: 1, updatedAt: Date.now() + 1e6, pages: [createPage({ id: 'distant', title: 'Distant' })] });
    const { result } = await setup();
    expect(result.current.pages.map((p) => p.id)).toEqual(['distant']);
  });

  test('la version serveur plus ancienne est ignorée', async () => {
    loadLocal.mockReturnValue({ version: 1, updatedAt: 5000, pages: [createPage({ id: 'local', title: 'Local' })] });
    loadRemote.mockResolvedValue({ version: 1, updatedAt: 1000, pages: [createPage({ id: 'vieux', title: 'Vieux' })] });
    const { result } = await setup();
    expect(result.current.pages.map((p) => p.id)).toEqual(['local']);
  });

  test("supprimer la page active renvoie sur la première page restante", async () => {
    const { result } = await setup();
    act(() => { result.current.addPage('Temp'); });
    const tempId = result.current.page.id;
    const firstId = result.current.pages[0].id;

    act(() => { result.current.removePage(tempId); });
    expect(result.current.pages.some((p) => p.id === tempId)).toBe(false);
    expect(result.current.page.id).toBe(firstId);
  });

  test('tout réinitialiser : efface le local, écrase le serveur, revient aux pages par défaut', async () => {
    const { result } = await setup();
    const defaults = result.current.pages.length;
    act(() => { result.current.addPage('Extra'); });

    act(() => { result.current.resetWorkspace(); });
    expect(clearLocal).toHaveBeenCalled();
    expect(saveRemote).toHaveBeenCalledWith(expect.objectContaining({ updatedAt: expect.any(Number) }));
    expect(result.current.pages).toHaveLength(defaults);
    expect(result.current.canUndo).toBe(false);
  });
});
