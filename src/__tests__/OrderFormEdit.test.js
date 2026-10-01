import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderForm } from '../features/orders/OrderForm';

const products = [
  { id: 'p1', name: 'Sticker chat', category: 'Ko-fi', price: 3, image: '🎁' },
  { id: 'p2', name: 'Print A5', category: 'Ko-fi', price: 0, image: '🎁' },
];
const customers = [{ id: 'c1', name: 'Alice', email: 'alice@ex.fr' }];

// Commande Ko-fi typique : articles sans prix sur la ligne, total payé > prix (prix libre).
const kofiOrder = {
  id: 'abcdef12-0000',
  channel: 'kofi',
  customer_name: 'Alice',
  customer_email: 'alice@ex.fr',
  items: [{ name: 'Sticker chat', quantity: 2, price: 0 }, { name: 'Print A5', quantity: 1, price: 0 }],
  total: 15,
  status: 'pending',
  order_date: '2026-09-10',
  tracking: null,
  notes: null,
  // colonnes des migrations 0005/0008 absentes : undefined comme sur une base non migrée
};

const setup = (order, overrides = {}) => {
  const onUpdate = jest.fn().mockResolvedValue({});
  const onClose = jest.fn();
  render(<OrderForm order={order} products={products} customers={customers} createProduct={jest.fn()} onUpdate={onUpdate} onClose={onClose} {...overrides} />);
  return { onUpdate, onClose };
};

const submit = () => fireEvent.click(screen.getByRole('button', { name: /enregistrer les modifications/i }));

describe('OrderForm en modification', () => {
  test("s'ouvre prérempli sans erreur, total conservé", () => {
    setup(kofiOrder);
    expect(screen.getByText('Modifier la commande')).toBeTruthy();
    expect(screen.getByDisplayValue('Alice')).toBeTruthy();
    expect(screen.getByText('15.00€')).toBeTruthy(); // total calculé, pas un champ
    expect(screen.queryByLabelText(/total payé/i)).toBeNull();
    expect(screen.getByDisplayValue('Sticker chat')).toBeTruthy();
  });

  test('sans aucun changement : rien n\'est envoyé et le formulaire se ferme', async () => {
    const { onUpdate, onClose } = setup(kofiOrder);
    submit();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onUpdate).not.toHaveBeenCalled();
  });

  test("changer seulement le client n'envoie que le client (pas les colonnes des migrations)", async () => {
    const { onUpdate, onClose } = setup(kofiOrder);
    fireEvent.change(screen.getByDisplayValue('Alice'), { target: { value: 'Bob' } });
    submit();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith('abcdef12-0000', { customer_name: 'Bob' });
  });

  test('modifier une quantité met à jour les articles et recalcule le total', async () => {
    const { onUpdate } = setup(kofiOrder);
    fireEvent.change(screen.getAllByDisplayValue('2')[0], { target: { value: '3' } });
    submit();
    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    const [, changes] = onUpdate.mock.calls[0];
    expect(changes.items[0]).toEqual({ name: 'Sticker chat', quantity: 3, price: 3 });
    expect(changes.total).toBe(18); // 3 × 3 + 9 : le total se recalcule tout seul
  });

  test('ajouter un divers et une commission envoie extras et commission_rate', async () => {
    const { onUpdate } = setup({ ...kofiOrder, channel: 'reel', extras: [], commission_rate: null });
    fireEvent.click(screen.getAllByText('Ajouter')[1]); // « Ajouter » de la section Divers
    fireEvent.change(screen.getByPlaceholderText('Ex : frais de port'), { target: { value: 'Emballage' } });
    fireEvent.change(screen.getByPlaceholderText('€'), { target: { value: '1.5' } });
    fireEvent.change(screen.getByPlaceholderText('Ex : 30'), { target: { value: '30' } });
    submit();
    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    const [, changes] = onUpdate.mock.calls[0];
    expect(changes.extras).toEqual([{ label: 'Emballage', amount: 1.5 }]);
    expect(changes.commission_rate).toBe(30);
  });

  test("une erreur du serveur s'affiche au lieu de planter", async () => {
    const onUpdate = jest.fn().mockRejectedValue(new Error('Boom serveur'));
    setup(kofiOrder, { onUpdate });
    fireEvent.change(screen.getByDisplayValue('Alice'), { target: { value: 'Bob' } });
    submit();
    expect(await screen.findByText('Boom serveur')).toBeTruthy();
  });

  // Commande jamais détaillée : simple montant de 285 € (cas réel), sans aucun article.
  const lumpSum = { ...kofiOrder, channel: 'reel', items: [], total: 285, commission_rate: 15, extras: [] };

  test("commande sans article : on peut changer la date, et seule la date est envoyée", async () => {
    const { onUpdate, onClose } = setup(lumpSum);
    expect(screen.getByText('Montant non détaillé')).toBeTruthy();
    fireEvent.change(screen.getByDisplayValue('2026-09-10'), { target: { value: '2026-09-12' } });
    submit();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onUpdate).toHaveBeenCalledWith('abcdef12-0000', { order_date: '2026-09-12' });
  });

  test('commande sans article + un divers : le total = 285 + divers, calculé', async () => {
    const { onUpdate } = setup(lumpSum);
    fireEvent.click(screen.getAllByText('Ajouter')[1]);
    fireEvent.change(screen.getByPlaceholderText('Ex : frais de port'), { target: { value: 'Emballage' } });
    fireEvent.change(screen.getByPlaceholderText('€'), { target: { value: '5' } });
    submit();
    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    const [, changes] = onUpdate.mock.calls[0];
    expect(changes.extras).toEqual([{ label: 'Emballage', amount: 5 }]);
    expect(changes.total).toBe(290);
  });

  test('une ligne divers incomplète est signalée, pas ignorée en silence', async () => {
    const { onUpdate } = setup(lumpSum);
    fireEvent.click(screen.getAllByText('Ajouter')[1]);
    fireEvent.change(screen.getByPlaceholderText('Ex : frais de port'), { target: { value: 'Emballage' } });
    submit();
    expect(await screen.findByText(/complète la ligne divers/i)).toBeTruthy();
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
