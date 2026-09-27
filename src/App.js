import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { Orders } from './components/orders/Orders';
import { Products } from './components/products/Products';
import { Customers } from './components/customers/Customers';
import { Reports } from './components/reports/Reports';
import { Settings } from './components/settings/Settings';
import { Login } from './components/auth/Login';
import { useOrders } from './hooks/useOrders';
import { useProducts } from './hooks/useProducts';
import { useCustomers } from './hooks/useCustomers';
import { onUnauthorized } from './api/client';
import { supabase } from './api/supabaseClient';

const CreativeDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedProductName, setSelectedProductName] = useState(null);
  const { orders, createOrder, updateOrder } = useOrders();
  const { products, createProduct, updateProduct } = useProducts();
  const { customers, createCustomer, updateCustomer } = useCustomers();

  const handleSelectOrder = (order) => {
    setSelectedOrderId(order.id);
    setActiveTab('orders');
  };

  const handleNavigateToProduct = (name) => {
    setSelectedProductName(name);
    setActiveTab('products');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard orders={orders} products={products} />;
      case 'orders':
        return (
          <Orders
            orders={orders}
            products={products}
            createOrder={createOrder}
            updateOrder={updateOrder}
            onNavigateToProduct={handleNavigateToProduct}
            selectedOrderId={selectedOrderId}
            onClearSelectedOrder={() => setSelectedOrderId(null)}
          />
        );
      case 'products':
        return (
          <Products
            products={products}
            orders={orders}
            createProduct={createProduct}
            updateProduct={updateProduct}
            selectedProductName={selectedProductName}
            onClearSelectedProduct={() => setSelectedProductName(null)}
          />
        );
      case 'customers':
        return (
          <Customers
            customers={customers}
            orders={orders}
            createCustomer={createCustomer}
            updateCustomer={updateCustomer}
          />
        );
      case 'settings':
        return <Settings />;
      case 'reports':
        return <Reports orders={orders} products={products} />;
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
        <Header orders={orders} onSelectOrder={handleSelectOrder} onOpenMenu={() => setMobileMenuOpen(true)} activeTab={activeTab} />
        <main className="flex-1 overflow-auto">{renderContent()}</main>
      </div>
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
