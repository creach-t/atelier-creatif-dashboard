// Découpe une liste en lots de `size` éléments (requêtes `in (...)` et insertions groupées de taille bornée).
const chunk = (list, size) => {
  const chunks = [];
  for (let i = 0; i < list.length; i += size) chunks.push(list.slice(i, i + size));
  return chunks;
};

module.exports = { chunk };
