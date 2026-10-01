import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderDetailModal } from '../features/orders/OrderDetailModal';

const order = {
  id: 'abcdef12-0000',
  channel: 'reel',
  customer_name: 'Alice',
  customer_email: 'alice@ex.fr',
  items: [{ name: 'Sticker chat', quantity: 2, price: 3 }],
  total: 10,
  status: 'shipped',
  order_date: '2026-09-10',
  tracking: 'SUIVI-42',
  notes: 'Emballage cadeau',
  commission_rate: 20,
  extras: [{ label: 'Frais de port', amount: 4 }],
};
const products = [{ id: 'p1', name: 'Sticker chat', category: 'Ko-fi', price: 3, image: '🎁' }];

const setup = (props = {}) => {
  const handlers = { onEdit: jest.fn(), onDelete: jest.fn().mockResolvedValue(), onClose: jest.fn(), onNavigateToProduct: jest.fn() };
  render(<OrderDetailModal order={order} products={products} {...handlers} {...props} />);
  return handlers;
};

describe('fiche commande : lecture seule', () => {
  test("aucun champ modifiable ni bouton « Enregistrer » avant de cliquer sur Modifier", () => {
    setup();
    ['textbox', 'combobox', 'spinbutton', 'checkbox'].forEach((role) => expect(screen.queryAllByRole(role)).toHaveLength(0));
    expect(screen.queryByRole('button', { name: /enregistrer/i })).toBeNull();
  });

  test('affiche statut, suivi, notes, divers, commission et net en lecture', () => {
    setup();
    expect(screen.getByText('Expédiée')).toBeTruthy();
    expect(screen.getByText('SUIVI-42')).toBeTruthy();
    expect(screen.getByText('Emballage cadeau')).toBeTruthy();
    expect(screen.getByText('Frais de port')).toBeTruthy();
    expect(screen.getByText(/Commission de la boutique \(20 %\)/)).toBeTruthy();
    expect(screen.getByText('8.00€')).toBeTruthy(); // net perçu : 10 − 20 %
  });

  test('« Modifier la commande » ouvre le formulaire (onEdit)', () => {
    const { onEdit } = setup();
    fireEvent.click(screen.getByRole('button', { name: /modifier la commande/i }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  test('la suppression demande deux confirmations', async () => {
    const { onDelete, onClose } = setup();
    fireEvent.click(screen.getByRole('button', { name: /supprimer la commande/i }));
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /oui, supprimer/i }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('abcdef12-0000'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
