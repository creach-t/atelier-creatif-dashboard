import React, { useEffect, useMemo, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { Orders } from './components/orders/Orders';
import { Products } from './components/products/Products';
import { Customers } from './components/customers/Customers';
import { Reports } from './components/reports/Reports';
import { Settings } from './components/settings/Settings';
import { Login } from './components/auth/Login';
import { OrderDetailModal } from './components/orders/OrderDetailModal';
import { ProductDetailModal } from './components/products/ProductDetailModal';
import { useOrders } from './hooks/useOrders';
import { useProducts } from './hooks/useProducts';
import { useCustomers } from './hooks/useCustomers';
import { computeSoldByName } from './utils/computeSoldByName';
import { onUnauthorized } from './api/client';
import { supabase } from './api/supabaseClient';

const CreativeDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState(null);
  const [editProductName, setEditProductName] = useState(null);
  const [initialOrderStatusFilter, setInitialOrderStatusFilter] = useState(null);
  // Popups globaux : ouvrir une commande ou un produit ne doit jamais changer d'onglet,
  // où qu'on clique depuis (Dashboard, notifications, fiche client, rapports...).
  const [viewingOrder, setViewingOrder] = useState(null);
  const [viewingProductName, setViewingProductName] = useState(null);
  const { orders, createOrder, updateOrder } = useOrders();
  const { products, createProduct, updateProduct } = useProducts();
  const { customers, createCustomer, updateCustomer } = useCustomers();

  const soldByName = useMemo(() => computeSoldByName(orders), [orders]);
  const viewingProduct = viewingProductName ? products.find((p) => p.name === viewingProductName) : null;

  const handleViewOrder = (order) => setViewingOrder(order);
  const handleViewProduct = (name) => setViewingProductName(name);

  const handleNavigateToCustomer = (name) => {
    setSelectedCustomerName(name);
    setActiveTab('customers');
  };

  const handleGoToOrders = (statusFilter) => {
    if (statusFilter) setInitialOrderStatusFilter(statusFilter);
    setActiveTab('orders');
  };

  // "Modifier" depuis la fiche (vue) d'un produit : seule action qui change vraiment
  // d'onglet — c'est une étape volontaire, pas la conséquence d'un simple clic pour regarder.
  const handleEditProduct = (name) => {
    setViewingProductName(null);
    setEditProductName(name);
    setActiveTab('products');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            orders={orders}
            products={products}
            onSelectOrder={handleViewOrder}
            onNavigateToProduct={handleViewProduct}
            onGoToOrders={handleGoToOrders}
            onGoToProducts={() => setActiveTab('products')}
          />
        );
      case 'orders':
        return (
          <Orders
            orders={orders}
            products={products}
            customers={customers}
            createOrder={createOrder}
            updateOrder={updateOrder}
            createProduct={createProduct}
            onViewOrder={handleViewOrder}
            initialStatusFilter={initialOrderStatusFilter}
            onClearInitialStatusFilter={() => setInitialOrderStatusFilter(null)}
          />
        );
      case 'products':
        return (
          <Products
            products={products}
            orders={orders}
            createProduct={createProduct}
            updateProduct={updateProduct}
            onViewProduct={handleViewProduct}
            editProductName={editProductName}
            onClearEditProductName={() => setEditProductName(null)}
          />
        );
      case 'customers':
        return (
          <Customers
            customers={customers}
            orders={orders}
            createCustomer={createCustomer}
            updateCustomer={updateCustomer}
            onSelectOrder={handleViewOrder}
            selectedCustomerName={selectedCustomerName}
            onClearSelectedCustomer={() => setSelectedCustomerName(null)}
          />
        );
      case 'settings':
        return <Settings />;
      case 'reports':
        return (
          <Reports
            orders={orders}
            products={products}
            customers={customers}
            onViewOrder={handleViewOrder}
            onViewProduct={handleViewProduct}
            onNavigateToCustomer={handleNavigateToCustomer}
          />
        );
      default:
        return <Dashboard orders={orders} products={products} />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-25 via-pink-25 to-blue-25">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header orders={orders} onSelectOrder={handleViewOrder} onOpenMenu={() => setMobileMenuOpen(true)} activeTab={activeTab} />
        <main className="flex-1 overflow-auto">{renderContent()}</main>
      </div>

      {viewingOrder && (
        <OrderDetailModal
          order={viewingOrder}
          products={products}
          onUpdate={updateOrder}
          onNavigateToProduct={(name) => {
            setViewingOrder(null);
            handleViewProduct(name);
          }}
          onClose={() => setViewingOrder(null)}
        />
      )}

      {viewingProduct && (
        <ProductDetailModal
          product={viewingProduct}
          sold={soldByName[viewingProduct.name] || 0}
          onEdit={() => handleEditProduct(viewingProduct.name)}
          onClose={() => setViewingProductName(null)}
        />
      )}
    </div>
  );
};

const LoadingScreen = () => (
  <div className="flex h-screen items-center justify-center bg-gradient-to-br from-purple-25 via-pink-25 to-blue-25">
    <p className="text-gray-500">Chargement...</p>
  </div>
);

const App = () => {
  const [session, setSession] = useState(undefined); // undefined = pas encore vérifié

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => onUnauthorized(() => supabase.auth.signOut()), []);

  if (session === undefined) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Login />;
  }

  return <CreativeDashboard />;
};

export default App;
