import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ShoppingCart, 
  Palette, 
  Truck, 
  TrendingUp, 
  Plus, 
  Search,
  Filter,
  Edit,
  Eye,
  MoreHorizontal,
  Home,
  Settings,
  Bell,
  User,
  Star,
  Heart,
  DollarSign,
  AlertCircle,
  Check,
  Clock,
  ChevronDown
} from 'lucide-react';

// Hook pour la gestion des données
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue];
};

// Données initiales
const initialOrders = [
  {
    id: '001',
    customer: 'Marie Dubois',
    email: 'marie.dubois@email.com',
    products: [
      { name: 'Sticker Chat Kawaii', quantity: 3, price: 4.50 },
      { name: 'Figurine Licorne', quantity: 1, price: 15.00 }
    ],
    total: 28.50,
    status: 'pending',
    date: '2025-07-07',
    shipping: 'standard'
  },
  {
    id: '002',
    customer: 'Pierre Martin',
    email: 'pierre.martin@email.com',
    products: [
      { name: 'Illustration Personnalisée', quantity: 1, price: 35.00 }
    ],
    total: 35.00,
    status: 'shipped',
    date: '2025-07-06',
    tracking: 'LP123456789FR',
    shipping: 'express'
  }
];

const initialProducts = [
  {
    id: '1',
    name: 'Sticker Chat Kawaii',
    category: 'Stickers',
    price: 4.50,
    stock: 25,
    minStock: 5,
    image: '🐱'
  },
  {
    id: '2',
    name: 'Figurine Licorne',
    category: 'Figurines',
    price: 15.00,
    stock: 8,
    minStock: 3,
    image: '🦄'
  },
  {
    id: '3',
    name: 'Illustration Personnalisée',
    category: 'Illustrations',
    price: 35.00,
    stock: 999,
    minStock: 1,
    image: '🎨'
  }
];

// Composant Card réutilisable
const Card = ({ children, className = '', hover = false }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-purple-100 ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''} ${className}`}>
    {children}
  </div>
);

// Composant Button réutilisable
const Button = ({ children, variant = 'primary', size = 'md', onClick, className = '', ...props }) => {
  const baseClasses = 'font-medium rounded-xl transition-all duration-200 flex items-center gap-2';
  const variants = {
    primary: 'bg-gradient-to-r from-pink-400 to-purple-400 text-white hover:from-pink-500 hover:to-purple-500 shadow-lg hover:shadow-xl',
    secondary: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
    ghost: 'text-gray-600 hover:bg-gray-50'
  };
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-6 py-4 text-base'
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Composant Badge pour les statuts
const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    shipped: 'bg-blue-100 text-blue-800 border-blue-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${variants[variant]}`}>
      {children}
    </span>
  );
};

// Composant Sidebar
const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'orders', label: 'Commandes', icon: ShoppingCart },
    { id: 'products', label: 'Produits', icon: Palette },
    { id: 'shipping', label: 'Expéditions', icon: Truck },
    { id: 'reports', label: 'Rapports', icon: TrendingUp }
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-purple-50 to-pink-50 border-r border-purple-100 h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Atelier Créatif
        </h1>
        <p className="text-sm text-gray-600 mt-1">Gestion des commandes</p>
      </div>
      
      <nav className="mt-6 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 mb-2 rounded-xl transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-white shadow-sm text-purple-700 border border-purple-100'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-6 left-3 right-3">
        <div className="bg-white rounded-xl p-4 border border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Artiste</p>
              <p className="text-sm text-gray-600">Créatrice</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant Header
const Header = () => (
  <header className="bg-white border-b border-purple-100 px-6 py-4">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Gérez votre activité créative</p>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-600 hover:bg-purple-50 rounded-xl transition-colors">
          <Bell size={20} />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full"></div>
        </button>
        <button className="p-2 text-gray-600 hover:bg-purple-50 rounded-xl transition-colors">
          <Settings size={20} />
        </button>
      </div>
    </div>
  </header>
);

// Composant Dashboard
const Dashboard = ({ orders, products }) => {
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const lowStockProducts = products.filter(product => product.stock <= product.minStock).length;
  const shippedToday = orders.filter(order => 
    order.status === 'shipped' && order.date === new Date().toISOString().split('T')[0]
  ).length;

  const metrics = [
    {
      title: 'Revenus Total',
      value: `${totalRevenue.toFixed(2)}€`,
      icon: DollarSign,
      color: 'from-green-400 to-emerald-400',
      change: '+12%'
    },
    {
      title: 'Commandes en Attente',
      value: pendingOrders,
      icon: Clock,
      color: 'from-yellow-400 to-orange-400',
      change: '+3'
    },
    {
      title: 'Stock Faible',
      value: lowStockProducts,
      icon: AlertCircle,
      color: 'from-red-400 to-pink-400',
      change: lowStockProducts > 0 ? 'Attention' : 'OK'
    },
    {
      title: 'Expédiés Aujourd\'hui',
      value: shippedToday,
      icon: Truck,
      color: 'from-blue-400 to-purple-400',
      change: '+1'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Métriques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="p-6" hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{metric.value}</p>
                  <p className="text-sm text-green-600 mt-1">{metric.change}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${metric.color} rounded-xl flex items-center justify-center`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Commandes récentes */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Commandes Récentes</h3>
          <Button variant="ghost" size="sm">
            <Eye size={16} />
            Voir tout
          </Button>
        </div>
        <div className="space-y-4">
          {orders.slice(0, 3).map((order) => (
            <div key={order.id} className="flex items-center justify-between p-4 bg-purple-25 rounded-xl hover:bg-purple-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                  {order.customer.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{order.customer}</p>
                  <p className="text-sm text-gray-600">Commande #{order.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{order.total.toFixed(2)}€</p>
                  <p className="text-sm text-gray-600">{order.date}</p>
                </div>
                <Badge variant={order.status}>
                  {order.status === 'pending' ? 'En attente' : 
                   order.status === 'shipped' ? 'Expédiée' : 
                   order.status === 'delivered' ? 'Livrée' : order.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Produits populaires */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Produits Populaires</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.slice(0, 3).map((product) => (
            <div key={product.id} className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
              <div className="text-3xl mb-3">{product.image}</div>
              <h4 className="font-medium text-gray-900 mb-1">{product.name}</h4>
              <p className="text-sm text-gray-600 mb-2">{product.category}</p>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-purple-600">{product.price.toFixed(2)}€</span>
                <span className="text-sm text-gray-600">Stock: {product.stock}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// Composant Orders
const Orders = ({ orders, setOrders }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Gestion des Commandes</h3>
        <Button>
          <Plus size={16} />
          Nouvelle Commande
        </Button>
      </div>

      {/* Filtres */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par client ou numéro..."
              className="w-full pl-10 pr-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="shipped">Expédiées</option>
            <option value="delivered">Livrées</option>
          </select>
        </div>
      </Card>

      {/* Liste des commandes */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-50">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">Commande</th>
                <th className="text-left p-4 font-semibold text-gray-700">Client</th>
                <th className="text-left p-4 font-semibold text-gray-700">Produits</th>
                <th className="text-left p-4 font-semibold text-gray-700">Total</th>
                <th className="text-left p-4 font-semibold text-gray-700">Statut</th>
                <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-purple-100 hover:bg-purple-25">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-gray-900">#{order.id}</p>
                      <p className="text-sm text-gray-600">{order.date}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-gray-900">{order.customer}</p>
                      <p className="text-sm text-gray-600">{order.email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      {order.products.map((product, index) => (
                        <p key={index} className="text-sm text-gray-600">
                          {product.name} x{product.quantity}
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-gray-900">{order.total.toFixed(2)}€</span>
                  </td>
                  <td className="p-4">
                    <Badge variant={order.status}>
                      {order.status === 'pending' ? 'En attente' : 
                       order.status === 'shipped' ? 'Expédiée' : 
                       order.status === 'delivered' ? 'Livrée' : order.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-600 hover:bg-purple-50 rounded-lg">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-purple-50 rounded-lg">
                        <Edit size={16} />
                      </button>
                      {order.status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateOrderStatus(order.id, 'shipped')}
                        >
                          Expédier
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// Composant Products
const Products = ({ products, setProducts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = [...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Catalogue Produits</h3>
        <Button>
          <Plus size={16} />
          Nouveau Produit
        </Button>
      </div>

      {/* Filtres */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              className="w-full pl-10 pr-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Toutes catégories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Grille des produits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="p-6" hover>
            <div className="text-center">
              <div className="text-4xl mb-4">{product.image}</div>
              <h4 className="font-semibold text-gray-900 mb-2">{product.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{product.category}</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-purple-600">{product.price.toFixed(2)}€</span>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  product.stock <= product.minStock 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  Stock: {product.stock}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1">
                  <Edit size={14} />
                  Modifier
                </Button>
                <Button variant="secondary" size="sm" className="flex-1">
                  <Eye size={14} />
                  Voir
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Composant principal
const CreativeDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useLocalStorage('orders', initialOrders);
  const [products, setProducts] = useLocalStorage('products', initialProducts);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard orders={orders} products={products} />;
      case 'orders':
        return <Orders orders={orders} setOrders={setOrders} />;
      case 'products':
        return <Products products={products} setProducts={setProducts} />;
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
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default CreativeDashboard;