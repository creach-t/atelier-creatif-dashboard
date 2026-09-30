import { useResource } from './useResource';

export function useProducts() {
  const { items, loading, error, refresh, create, update, remove } = useResource('/products');
  return { products: items, loading, error, refresh, createProduct: create, updateProduct: update, deleteProduct: remove };
}
