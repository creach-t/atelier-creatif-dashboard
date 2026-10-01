import React, { createContext, useContext, useMemo } from 'react';
import { useOrders } from './useOrders';
import { useProducts } from './useProducts';
import { useCustomers } from './useCustomers';
import { useEstimatedPrices } from './useEstimatedPrices';
import { estimatePrices, resolveProducts, catalogPrices } from '../utils/estimatePrices';
import { groupProducts } from '../utils/productVariants';
import { computeProductRevenue } from '../utils/computeProductRevenue';
import { computeSoldByName } from '../utils/computeSoldByName';
import { withCustomerStats } from '../utils/customerStats';
import { isCounted } from '../utils/orderAmounts';

const DataContext = createContext(null);

// Source unique des données métier pour tous les widgets : commandes, produits, clients, et les dérivés
// coûteux calculés une seule fois (prix estimés, groupes de variantes, ventes par produit).
export const DataProvider = ({ children }) => {
  const { orders, loading, createOrder, updateOrder, deleteOrder } = useOrders();
  const { products: rawProducts, createProduct, updateProduct, deleteProduct } = useProducts();
  const { customers, createCustomer, updateCustomer } = useCustomers();

  // Prix estimés à partir de toutes les commandes : appliqués tout de suite à l'affichage et écrits en base
  // en tâche de fond quand ils sont quasi sûrs.
  const priceEstimates = useMemo(() => estimatePrices(orders, rawProducts), [orders, rawProducts]);
  const products = useMemo(() => resolveProducts(rawProducts, priceEstimates), [rawProducts, priceEstimates]);
  useEstimatedPrices(rawProducts, priceEstimates, updateProduct);

  const value = useMemo(() => {
    const counted = orders.filter(isCounted); // les annulées ne comptent ni en ventes ni en revenus
    const soldByName = computeSoldByName(counted);
    const revenueByName = Object.fromEntries(
      computeProductRevenue(counted, catalogPrices(products)).map((r) => [r.name, r.revenue])
    );
    return {
      loading,
      orders,
      products,
      customers,
      customerRows: withCustomerStats(customers, counted),
      productGroups: groupProducts(products),
      soldByName,
      revenueByName,
      createOrder, updateOrder, deleteOrder,
      createProduct, updateProduct, deleteProduct,
      createCustomer, updateCustomer,
    };
  }, [
    loading, orders, products, customers,
    createOrder, updateOrder, deleteOrder, createProduct, updateProduct, deleteProduct, createCustomer, updateCustomer,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData doit être utilisé sous <DataProvider>');
  return ctx;
};
