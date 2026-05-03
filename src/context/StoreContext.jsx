import React, { createContext, useContext, useState, useCallback } from 'react';

const StoreContext = createContext();

const initialUsers = [
  { id: 1, username: 'admin', password: '123', name: 'Administrateur', role: 'manager' },
  { id: 2, username: 'compta', password: '123', name: 'Comptable', role: 'accountant' },
  { id: 3, username: 'caisse1', password: '123', name: 'Caissier 1', role: 'cashier' },
  { id: 4, username: 'caisse2', password: '123', name: 'Caissier 2', role: 'cashier' },
];

const initialProducts = [
  { id: 1, name: 'Riz Basmati 5kg', category: 'Alimentation', price: 4500, cost: 3200, stock: 45, minStock: 10 },
  { id: 2, name: 'Huile Tournesol 5L', category: 'Alimentation', price: 6800, cost: 5100, stock: 30, minStock: 8 },
  { id: 3, name: 'Sucre en poudre 1kg', category: 'Alimentation', price: 1200, cost: 850, stock: 60, minStock: 15 },
  { id: 4, name: 'Lait en poudre 400g', category: 'Alimentation', price: 3500, cost: 2600, stock: 25, minStock: 10 },
  { id: 5, name: 'Savon Marseille', category: 'Hygiène', price: 800, cost: 500, stock: 100, minStock: 20 },
  { id: 6, name: 'Dentifrice Signal', category: 'Hygiène', price: 1500, cost: 1000, stock: 40, minStock: 12 },
  { id: 7, name: 'Eau Minérale 1.5L', category: 'Boissons', price: 350, cost: 200, stock: 200, minStock: 50 },
  { id: 8, name: 'Jus d\'Orange 1L', category: 'Boissons', price: 1800, cost: 1200, stock: 35, minStock: 10 },
  { id: 9, name: 'Cahier 200 pages', category: 'Fournitures', price: 900, cost: 600, stock: 80, minStock: 20 },
  { id: 10, name: 'Stylo BIC bleu', category: 'Fournitures', price: 250, cost: 150, stock: 150, minStock: 30 },
  { id: 11, name: 'Farine de blé 1kg', category: 'Alimentation', price: 1100, cost: 750, stock: 55, minStock: 15 },
  { id: 12, name: 'Pâtes Spaghetti 500g', category: 'Alimentation', price: 950, cost: 650, stock: 70, minStock: 20 },
  { id: 13, name: 'Shampooing Dove', category: 'Hygiène', price: 2800, cost: 1900, stock: 3, minStock: 10 },
  { id: 14, name: 'Détergent OMO 1kg', category: 'Ménage', price: 3200, cost: 2300, stock: 5, minStock: 8 },
  { id: 15, name: 'Thé vert Lipton', category: 'Boissons', price: 2200, cost: 1500, stock: 28, minStock: 8 },
  { id: 16, name: 'Café moulu 250g', category: 'Boissons', price: 3800, cost: 2700, stock: 18, minStock: 5 },
  { id: 17, name: 'Biscuits Petit Beurre', category: 'Alimentation', price: 650, cost: 400, stock: 90, minStock: 25 },
  { id: 18, name: 'Papier toilette x4', category: 'Ménage', price: 1400, cost: 900, stock: 45, minStock: 15 },
];

const generateSalesHistory = () => {
  const sales = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    date.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
    const numItems = Math.floor(Math.random() * 4) + 1;
    const items = [];
    let total = 0;
    for (let j = 0; j < numItems; j++) {
      const product = initialProducts[Math.floor(Math.random() * initialProducts.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      items.push({ productId: product.id, name: product.name, price: product.price, quantity: qty });
      total += product.price * qty;
    }
    sales.push({
      id: i + 1,
      date: date.toISOString(),
      items,
      total,
      paymentMethod: Math.random() > 0.3 ? 'Espèces' : 'Carte',
      cashier: Math.random() > 0.5 ? 'Caissier 1' : 'Caissier 2',
    });
  }
  return sales.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const formatPrice = (amount) => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};

export const StoreProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState(initialProducts);
  const [sales, setSales] = useState(generateSalesHistory());
  const [cart, setCart] = useState([]);
  const [users] = useState(initialUsers);

  const login = useCallback((username, password) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) { setCurrentUser({ ...user }); return true; }
    return false;
  }, [users]);

  const logout = useCallback(() => { setCurrentUser(null); setCart([]); }, []);

  const addProduct = useCallback((product) => {
    setProducts(prev => [...prev, { ...product, id: Math.max(...prev.map(p => p.id)) + 1 }]);
  }, []);

  const updateProduct = useCallback((id, updates) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deleteProduct = useCallback((id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      if (product.stock <= 0) return prev;
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  }, []);

  const updateCartQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) { setCart(prev => prev.filter(item => item.productId !== productId)); return; }
    setCart(prev => prev.map(item => item.productId === productId ? { ...item, quantity } : item));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const completeSale = useCallback((paymentMethod) => {
    if (cart.length === 0) return null;
    const sale = {
      id: sales.length + 1,
      date: new Date().toISOString(),
      items: [...cart],
      total: cartTotal,
      paymentMethod,
      cashier: currentUser?.name || 'Inconnu',
    };
    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(item => item.productId === p.id);
      return cartItem ? { ...p, stock: Math.max(0, p.stock - cartItem.quantity) } : p;
    }));
    setSales(prev => [sale, ...prev]);
    setCart([]);
    return sale;
  }, [cart, cartTotal, currentUser, sales.length]);

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const todaySales = sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString());
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const totalStockValue = products.reduce((sum, p) => sum + p.cost * p.stock, 0);
  const categories = [...new Set(products.map(p => p.category))];

  const value = {
    currentUser, login, logout,
    products, addProduct, updateProduct, deleteProduct, categories,
    cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartTotal, completeSale,
    sales, totalRevenue, todaySales, todayRevenue, lowStockProducts, totalStockValue, users,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
