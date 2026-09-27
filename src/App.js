import React, { useEffect, useState, useCallback } from 'react';
import { Truck, TrendingUp } from 'lucide-react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { Orders } from './components/orders/Orders';
import { Products } from './components/products/Products';
import { Login } from './components/auth/Login';
import { Onboarding } from './components/onboarding/Onboarding';
import { Card } from './components/ui/Card';
import { useOrders } from './hooks/useOrders';
import { useProducts } from './hooks/useProducts';
import { apiClient, onUnauthorized } from './api/client';
import { supabase } from './api/supabaseClient';

const CreativeDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { orders, createOrder, updateOrder } = useOrders();
  const { products } = useProducts();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard orders={orders} products={products} />;
      case 'orders':
        return <Orders orders={orders} createOrder={createOrder} updateOrder={updateOrder} />;
      case 'products':
        return <Products products={products} />;
      case 'shipping':
        return (
          <div className="p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Gestion des Expéditions</h3>
            <Card className="p-8 text-center">
              <Truck size={48} className="mx-auto text-purple-400 mb-4" />
              <p className="text-gray-600">Module d'expédition en développement</p>
              <p className="text-sm text-gray-500 mt-2">Intégration La Poste à venir</p>
            </Card>
          </div>
        );
      case 'reports':
        return (
          <div className="p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Rapports et Analyses</h3>
            <Card className="p-8 text-center">
              <TrendingUp size={48} className="mx-auto text-purple-400 mb-4" />
              <p className="text-gray-600">Module de rapports en développement</p>
              <p className="text-sm text-gray-500 mt-2">Statistiques détaillées à venir</p>
            </Card>
          </div>
        );
      default:
        return <Dashboard orders={orders} products={products} />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-25 via-pink-25 to-blue-25">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
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
  const [profile, setProfile] = useState(undefined);

  const loadProfile = useCallback(async () => {
    try {
      const data = await apiClient.get('/profile');
      setProfile(data);
    } catch (err) {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) setProfile(undefined);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadProfile();
  }, [session, loadProfile]);

  useEffect(() => onUnauthorized(() => supabase.auth.signOut()), []);

  if (session === undefined) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Login />;
  }

  if (profile === undefined) {
    return <LoadingScreen />;
  }

  if (profile && !profile.onboarding_completed) {
    return <Onboarding onComplete={loadProfile} />;
  }

  return <CreativeDashboard />;
};

export default App;
