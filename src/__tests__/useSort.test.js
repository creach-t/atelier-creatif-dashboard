import { sortRows } from '../hooks/useSort';

const rows = [
  { name: 'béa', total: 10, date: '2026-01-02' },
  { name: 'Alice', total: 30, date: null },
  { name: 'Chloé', total: 20, date: '2026-03-01' },
  { name: 'Dan', total: 20, date: '2026-02-01' },
];
const acc = { name: (r) => r.name, total: (r) => r.total, date: (r) => r.date };

describe('sortRows', () => {
  test('texte : ordre alphabétique insensible à la casse et aux accents', () => {
    expect(sortRows(rows, { key: 'name', dir: 'asc' }, acc).map((r) => r.name)).toEqual(['Alice', 'béa', 'Chloé', 'Dan']);
  });

  test('nombres : desc, égalités départagées par l\'ordre d\'origine', () => {
    expect(sortRows(rows, { key: 'total', dir: 'desc' }, acc).map((r) => r.name)).toEqual(['Alice', 'Chloé', 'Dan', 'béa']);
  });

  test('valeurs vides toujours en dernier, dans les deux sens', () => {
    expect(sortRows(rows, { key: 'date', dir: 'asc' }, acc).map((r) => r.name).pop()).toBe('Alice');
    expect(sortRows(rows, { key: 'date', dir: 'desc' }, acc).map((r) => r.name).pop()).toBe('Alice');
  });
});
