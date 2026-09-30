import { useResource } from './useResource';

export function useCustomers() {
  const { items, loading, error, refresh, create, update, remove } = useResource('/customers');
  return { customers: items, loading, error, refresh, createCustomer: create, updateCustomer: update, deleteCustomer: remove };
}
