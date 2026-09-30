import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useData } from '../data/DataProvider';
import { OrderDetailModal } from '../../components/orders/OrderDetailModal';
import { OrderForm } from '../../components/orders/OrderForm';
import { ProductDetailModal } from '../../components/products/ProductDetailModal';
import { ProductForm } from '../../components/products/ProductForm';
import { CustomerDetailModal } from '../../components/customers/CustomerDetailModal';
import { CustomerForm } from '../../components/customers/CustomerForm';
import { findGroup } from '../../utils/productVariants';

const OverlayContext = createContext(null);

// Fenêtres globales (fiche / formulaire de commande, produit, client). Un widget n'a jamais à gérer ses
// propres modales ni à changer de page : il appelle `useOverlays().openOrder(order)` et c'est tout.
export const OverlayProvider = ({ children }) => {
  const data = useData();
  const [viewingOrder, setViewingOrder] = useState(null);
  const [orderForm, setOrderForm] = useState(null); // { order? } — sans `order` = création
  const [viewingProductName, setViewingProductName] = useState(null);
  const [productForm, setProductForm] = useState(null); // { product? }
  const [viewingCustomerName, setViewingCustomerName] = useState(null);
  const [customerForm, setCustomerForm] = useState(null); // { customer? }

  const api = useMemo(() => ({
    openOrder: (order) => setViewingOrder(order),
    newOrder: () => setOrderForm({}),
    openProduct: (name) => setViewingProductName(name),
    newProduct: () => setProductForm({}),
    editProduct: (product) => { setViewingProductName(null); setProductForm({ product }); },
    openCustomer: (name) => setViewingCustomerName(name),
    newCustomer: () => setCustomerForm({}),
    editCustomer: (customer) => { setViewingCustomerName(null); setCustomerForm({ customer }); },
  }), []);

  const viewingGroup = viewingProductName ? findGroup(data.productGroups, viewingProductName) : null;

  // La fiche client se calcule à l'ouverture depuis les commandes : un client vu dans un rapport peut ne
  // pas avoir de fiche enregistrée (commande Ko-fi sans client créé) — on l'affiche quand même.
  const viewingCustomer = useMemo(() => {
    if (!viewingCustomerName) return null;
    const row = data.customerRows.find((c) => c.name === viewingCustomerName);
    if (row) return row;
    const own = data.orders.filter((o) => o.customer_name === viewingCustomerName);
    if (own.length === 0) return null;
    const dates = own.map((o) => o.order_date).filter(Boolean).sort();
    return {
      name: viewingCustomerName, email: own.find((o) => o.customer_email)?.customer_email || null,
      total: own.reduce((s, o) => s + Number(o.total || 0), 0), count: own.length,
      first: dates[0] || null, last: dates[dates.length - 1] || null,
    };
  }, [viewingCustomerName, data.customerRows, data.orders]);

  const saveProduct = useCallback(async (payload) => {
    const editing = productForm && productForm.product;
    if (editing) {
      // Prix estimé laissé tel quel dans le formulaire : on ne le fige pas en prix saisi à la main.
      const untouchedEstimate = editing.price_estimated && Number(payload.price) === Number(editing.price);
      if (untouchedEstimate) {
        const { price, ...rest } = payload;
        await data.updateProduct(editing.id, rest);
        return;
      }
      await data.updateProduct(editing.id, payload);
    } else {
      await data.createProduct(payload);
    }
  }, [productForm, data]);

  const saveCustomer = useCallback(async (payload) => {
    const editing = customerForm && customerForm.customer;
    if (editing && editing.id) await data.updateCustomer(editing.id, payload);
    else await data.createCustomer(payload);
  }, [customerForm, data]);

  const supportsFlags = data.products.length === 0 || 'kind' in data.products[0];

  return (
    <OverlayContext.Provider value={api}>
      {children}

      {viewingOrder && (
        <OrderDetailModal
          order={viewingOrder}
          products={data.products}
          onDelete={data.deleteOrder}
          onEdit={() => { setOrderForm({ order: viewingOrder }); setViewingOrder(null); }}
          onNavigateToProduct={(name) => { setViewingOrder(null); setViewingProductName(name); }}
          onClose={() => setViewingOrder(null)}
        />
      )}

      {orderForm && (
        <OrderForm
          order={orderForm.order}
          products={data.products}
          customers={data.customers}
          createProduct={data.createProduct}
          onCreate={data.createOrder}
          onUpdate={data.updateOrder}
          onClose={() => setOrderForm(null)}
        />
      )}

      {viewingGroup && (
        <ProductDetailModal
          group={viewingGroup}
          soldByName={data.soldByName}
          revenueByName={data.revenueByName}
          onConfirmPrice={async (p, price) => { await data.updateProduct(p.id, { price }); }}
          onEdit={(name) => { const p = data.products.find((x) => x.name === name); if (p) api.editProduct(p); }}
          onDelete={async (product) => {
            await data.deleteProduct(product.id);
            // Une variante supprimée : la fiche reste ouverte sur une variante voisine ; sinon elle se ferme.
            const sibling = viewingGroup.variants.find((v) => v.product.id !== product.id);
            setViewingProductName(sibling ? sibling.product.name : null);
          }}
          onClose={() => setViewingProductName(null)}
        />
      )}

      {productForm && (
        <ProductForm
          supportsFlags={supportsFlags}
          product={productForm.product || null}
          onSave={saveProduct}
          onClose={() => setProductForm(null)}
        />
      )}

      {viewingCustomer && (
        <CustomerDetailModal
          customer={viewingCustomer}
          orders={data.orders.filter((o) => o.customer_name === viewingCustomer.name)}
          onSelectOrder={(order) => { setViewingCustomerName(null); setViewingOrder(order); }}
          onEdit={() => api.editCustomer(viewingCustomer)}
          onClose={() => setViewingCustomerName(null)}
        />
      )}

      {customerForm && (
        <CustomerForm customer={customerForm.customer || null} onSave={saveCustomer} onClose={() => setCustomerForm(null)} />
      )}
    </OverlayContext.Provider>
  );
};

export const useOverlays = () => {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error('useOverlays doit être utilisé sous <OverlayProvider>');
  return ctx;
};
