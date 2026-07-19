import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const StoreContext = createContext();

const initialUsers = [
  { id: 1, username: 'admin', password: '123', name: 'Administrateur', role: 'manager' },
  { id: 2, username: 'compta', password: '123', name: 'Comptable', role: 'accountant' },
  { id: 3, username: 'caisse1', password: '123', name: 'Caissier 1', role: 'cashier' },
  { id: 4, username: 'caisse2', password: '123', name: 'Caissier 2', role: 'cashier' },
  { id: 5, username: 'pdg', password: '123', name: 'Directeur Général', role: 'ceo' },
];

const initialProducts = [
  { id: 1, name: 'Riz Basmati 5kg', category: 'Alimentation', price: 4500, cost: 3200, stock: 45, physicalStock: 45, minStock: 10 },
  { id: 2, name: 'Huile Tournesol 5L', category: 'Alimentation', price: 6800, cost: 5100, stock: 30, physicalStock: 30, minStock: 8 },
  { id: 3, name: 'Sucre en poudre 1kg', category: 'Alimentation', price: 1200, cost: 850, stock: 60, physicalStock: 60, minStock: 15 },
  { id: 4, name: 'Lait en poudre 400g', category: 'Alimentation', price: 3500, cost: 2600, stock: 25, physicalStock: 25, minStock: 10 },
  { id: 5, name: 'Savon Marseille', category: 'Hygiène', price: 800, cost: 500, stock: 100, physicalStock: 100, minStock: 20 },
  { id: 6, name: 'Dentifrice Signal', category: 'Hygiène', price: 1500, cost: 1000, stock: 40, physicalStock: 40, minStock: 12 },
  { id: 7, name: 'Eau Minérale 1.5L', category: 'Boissons', price: 350, cost: 200, stock: 200, physicalStock: 200, minStock: 50 },
  { id: 8, name: 'Jus d\'Orange 1L', category: 'Boissons', price: 1800, cost: 1200, stock: 35, physicalStock: 35, minStock: 10 },
  { id: 9, name: 'Cahier 200 pages', category: 'Fournitures', price: 900, cost: 600, stock: 80, physicalStock: 80, minStock: 20 },
  { id: 10, name: 'Stylo BIC bleu', category: 'Fournitures', price: 250, cost: 150, stock: 150, physicalStock: 150, minStock: 30 },
  { id: 11, name: 'Farine de blé 1kg', category: 'Alimentation', price: 1100, cost: 750, stock: 55, physicalStock: 55, minStock: 15 },
  { id: 12, name: 'Pâtes Spaghetti 500g', category: 'Alimentation', price: 950, cost: 650, stock: 70, physicalStock: 70, minStock: 20 },
  { id: 13, name: 'Shampooing Dove', category: 'Hygiène', price: 2800, cost: 1900, stock: 3, physicalStock: 3, minStock: 10 },
  { id: 14, name: 'Détergent OMO 1kg', category: 'Ménage', price: 3200, cost: 2300, stock: 5, physicalStock: 5, minStock: 8 },
  { id: 15, name: 'Thé vert Lipton', category: 'Boissons', price: 2200, cost: 1500, stock: 28, physicalStock: 28, minStock: 8 },
  { id: 16, name: 'Café moulu 250g', category: 'Boissons', price: 3800, cost: 2700, stock: 18, physicalStock: 18, minStock: 5 },
  { id: 17, name: 'Biscuits Petit Beurre', category: 'Alimentation', price: 650, cost: 400, stock: 90, physicalStock: 90, minStock: 25 },
  { id: 18, name: 'Papier toilette x4', category: 'Ménage', price: 1400, cost: 900, stock: 45, physicalStock: 45, minStock: 15 },
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
      invoiceNumber: `MOCK-${1000 + i}`,
      storeId: 1,
      deliveryStatus: 'delivered',
      items: items.map(item => ({ ...item, isDelivered: true })) // Marquer les articles existants comme livrés
    });
  }
  return sales.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const formatPrice = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};

export const StoreProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [stores, setStores] = useState([
    { id: 1, name: 'Magasin Principal', location: 'Siège' }
  ]);
  const [activeStoreId, setActiveStoreId] = useState(1);
  const [categories, setCategories] = useState([...new Set(initialProducts.map(p => p.category))]);
  
  // Initialize products and sales with storeId: 1
  const [allProducts, setAllProducts] = useState(initialProducts.map(p => ({ ...p, storeId: 1 })));
  const [allSales, setAllSales] = useState(generateSalesHistory().map(s => ({ ...s, storeId: 1 })));
  
  const [cart, setCart] = useState([]);
  const [users, setUsers] = useState(initialUsers.map(u => ({ ...u, isActive: true, storeId: 1 })));
  const [invoiceCounters, setInvoiceCounters] = useState({});
  const [transfers, setTransfers] = useState([]);
  const [stockEntries, setStockEntries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerTransactions, setCustomerTransactions] = useState([]);
  
  // Nouveau: Gestion des casses et reconditionnements
  const [breakages, setBreakages] = useState([]);
  const [repackagings, setRepackagings] = useState([]);
  
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  
  // Paramètres globaux de l'entreprise
  const [companySettings, setCompanySettings] = useState(() => {
    const saved = localStorage.getItem('companySettings');
    return saved ? JSON.parse(saved) : {
      name: 'GROUPE T. GRAND ZAO INTER SARL',
      activity: 'COMMERCE GENERAL ET PRESTATION DE SERVICES',
      phones: '659 146 882 / 672 126 507 / 699 900 658',
      ncc: 'M042318164160W',
      rccm: '1391CH/N°94C1175/71994'
    };
  });

  const updateCompanySettings = useCallback((newSettings) => {
    setCompanySettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('companySettings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const [expenses, setExpenses] = useState([]);
  const [versements, setVersements] = useState([]);
  const [initialCashFund, setInitialCashFund] = useState(() => parseFloat(localStorage.getItem('initialCashFund')) || 0);
  const [isCashFundInitialized, setIsCashFundInitialized] = useState(() => localStorage.getItem('isCashFundInitialized') === 'true');
  const [cashInitializationDate, setCashInitializationDate] = useState(() => localStorage.getItem('cashInitializationDate'));
  const [lastClosingBalance, setLastClosingBalance] = useState(() => parseFloat(localStorage.getItem('lastClosingBalance')) || 0);
  const [cashReports, setCashReports] = useState(() => JSON.parse(localStorage.getItem('cashReports')) || []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  }, []);

  // Apply theme to document element
  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Filter products and sales for the active store
  const products = allProducts.filter(p => p.storeId === activeStoreId);
  const sales = allSales.filter(s => s.storeId === activeStoreId);
  const login = useCallback((username, password) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user && user.isActive) { 
      setCurrentUser({ ...user }); 
      if (user.storeId) setActiveStoreId(user.storeId);
      return true; 
    }
    return false;
  }, [users]);

  const logout = useCallback(() => { setCurrentUser(null); setCart([]); }, []);
  const addUser = useCallback((user) => {
    setUsers(prev => [...prev, { 
      ...user, 
      id: Math.max(...prev.map(u => u.id), 0) + 1,
      isActive: true
    }]);
  }, []);

  const updateUser = useCallback((id, updates) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  }, []);

  const toggleUserStatus = useCallback((id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
  }, []);

  const addStore = useCallback((store) => {
    setStores(prev => [...prev, { ...store, id: Math.max(...prev.map(s => s.id), 0) + 1 }]);
  }, []);

  const switchStore = useCallback((id) => {
    setActiveStoreId(id);
    setCart([]); // Clear cart when switching stores
  }, []);

  const updateStore = useCallback((id, updates) => {
    setStores(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const deleteStore = useCallback((id) => {
    if (stores.length <= 1) return; // Don't delete the last store
    setStores(prev => prev.filter(s => s.id !== id));
    setAllProducts(prev => prev.filter(p => p.storeId !== id));
    setAllSales(prev => prev.filter(s => s.storeId !== id));
    setUsers(prev => prev.filter(u => u.storeId !== id));
    if (activeStoreId === id) setActiveStoreId(stores.find(s => s.id !== id).id);
  }, [activeStoreId, stores]);

  const addCategory = useCallback((category) => {
    setCategories(prev => prev.includes(category) ? prev : [...prev, category]);
  }, []);

  const addProduct = useCallback((product) => {
    setAllProducts(prev => [...prev, { 
      ...product, 
      id: Math.max(...prev.map(p => p.id), 0) + 1,
      storeId: activeStoreId,
      physicalStock: product.stock // Initialiser le stock physique au même niveau que le théorique
    }]);
  }, [activeStoreId]);

  const updateProduct = useCallback((id, updates) => {
    setAllProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deleteProduct = useCallback((id) => {
    setAllProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  const bulkUpdateStock = useCallback((items, entryMeta = {}) => {
    setAllProducts(prev => prev.map(p => {
      const entry = items.find(item => item.productId === p.id);
      if (entry) {
        return {
          ...p,
          stock: p.stock + entry.quantity,
          physicalStock: p.physicalStock + entry.quantity,
          cost: entry.cost || p.cost
        };
      }
      return p;
    }));
    // Record the stock entry for accounting
    setStockEntries(prev => [{
      id: prev.length + 1,
      reference: entryMeta.reference || `ENT-${String(prev.length + 1).padStart(4, '0')}`,
      date: new Date().toISOString(),
      supplier: entryMeta.supplier || 'Non spécifié',
      noteNumber: entryMeta.noteNumber || '',
      storeId: activeStoreId,
      items: items.map(item => ({ ...item })),
      totalCost: items.reduce((sum, i) => sum + (i.quantity * (i.cost || 0)), 0),
      createdBy: entryMeta.createdBy || 'Manager',
    }, ...prev]);
  }, [activeStoreId]);

  // NOUVEAU: Déclaration de casse
  const declareBreakage = useCallback((productId, quantity, reason) => {
    let sourceProduct = null;
    let breakageRecord = null;
    let newProductName = "";

    setAllProducts(prev => {
      const newProducts = [...prev];
      const productIndex = newProducts.findIndex(p => p.id === productId);
      
      if (productIndex !== -1) {
        sourceProduct = { ...newProducts[productIndex] };
        // Déduire le stock du produit d'origine
        newProducts[productIndex] = {
          ...sourceProduct,
          stock: Math.max(0, sourceProduct.stock - quantity),
          physicalStock: Math.max(0, sourceProduct.physicalStock - quantity)
        };

        newProductName = `[Casse] ${sourceProduct.name}`;
        
        // Chercher si le produit dérivé "Casse" existe déjà dans ce magasin
        const breakageProductIndex = newProducts.findIndex(p => p.name === newProductName && p.storeId === activeStoreId);
        
        if (breakageProductIndex !== -1) {
          newProducts[breakageProductIndex] = {
            ...newProducts[breakageProductIndex],
            stock: newProducts[breakageProductIndex].stock + quantity,
            physicalStock: newProducts[breakageProductIndex].physicalStock + quantity
          };
        } else {
          // Créer le produit dérivé "Casse"
          const maxId = Math.max(...newProducts.map(p => p.id), 0);
          newProducts.push({
            id: maxId + 1,
            name: newProductName,
            category: 'Cartons Cassés',
            price: sourceProduct.price, // Prix modifiable ensuite par le caissier
            cost: sourceProduct.cost,
            stock: quantity,
            physicalStock: quantity,
            minStock: 0,
            storeId: activeStoreId,
            isBreakage: true,
            sourceProductId: productId
          });
        }
      }
      return newProducts;
    });

    if (sourceProduct) {
      breakageRecord = {
        id: breakages.length + 1,
        date: new Date().toISOString(),
        productId,
        productName: sourceProduct.name,
        quantity,
        reason,
        storeId: activeStoreId,
        createdBy: currentUser?.name || 'Manager',
        costValue: sourceProduct.cost * quantity
      };
      setBreakages(prev => [breakageRecord, ...prev]);
      
      // S'assurer que la catégorie "Cartons Cassés" existe
      setCategories(prev => prev.includes('Cartons Cassés') ? prev : [...prev, 'Cartons Cassés']);
    }
    return breakageRecord;
  }, [activeStoreId, currentUser, breakages.length]);

  // NOUVEAU: Création d'un reconditionnement en sacs
  const createRepackaging = useCallback((brokenProductId, brokenQty, newProductName, newProductQty, defaultPrice) => {
    let repackingRecord = null;
    let costPerNewUnit = 0;

    setAllProducts(prev => {
      const newProducts = [...prev];
      const brokenProductIndex = newProducts.findIndex(p => p.id === brokenProductId);
      
      if (brokenProductIndex !== -1) {
        const brokenProduct = newProducts[brokenProductIndex];
        // Déduire le stock des cartons cassés utilisés
        newProducts[brokenProductIndex] = {
          ...brokenProduct,
          stock: Math.max(0, brokenProduct.stock - brokenQty),
          physicalStock: Math.max(0, brokenProduct.physicalStock - brokenQty)
        };

        const totalCostValue = brokenProduct.cost * brokenQty;
        costPerNewUnit = newProductQty > 0 ? totalCostValue / newProductQty : 0;

        // Chercher si le nouveau produit "Sac" existe déjà
        const newProductIndex = newProducts.findIndex(p => p.name === newProductName && p.storeId === activeStoreId);
        
        if (newProductIndex !== -1) {
          newProducts[newProductIndex] = {
            ...newProducts[newProductIndex],
            stock: newProducts[newProductIndex].stock + newProductQty,
            physicalStock: newProducts[newProductIndex].physicalStock + newProductQty,
            // Mettre à jour le coût moyen pondéré si on veut, mais ici on garde simple
          };
        } else {
          // Créer le produit Sac
          const maxId = Math.max(...newProducts.map(p => p.id), 0);
          newProducts.push({
            id: maxId + 1,
            name: newProductName,
            category: 'Sacs de casses',
            price: defaultPrice,
            cost: costPerNewUnit,
            stock: newProductQty,
            physicalStock: newProductQty,
            minStock: 0,
            storeId: activeStoreId,
            isRepackaged: true
          });
        }

        repackingRecord = {
          id: repackagings.length + 1,
          date: new Date().toISOString(),
          sourceProductId: brokenProductId,
          sourceProductName: brokenProduct.name,
          sourceQuantity: brokenQty,
          targetProductName: newProductName,
          targetQuantity: newProductQty,
          storeId: activeStoreId,
          createdBy: currentUser?.name || 'Manager',
          totalCostValue
        };
      }
      return newProducts;
    });

    if (repackingRecord) {
      setRepackagings(prev => [repackingRecord, ...prev]);
      setCategories(prev => prev.includes('Sacs de casses') ? prev : [...prev, 'Sacs de casses']);
    }
    return repackingRecord;
  }, [activeStoreId, currentUser, repackagings.length]);

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (!product.isNonInventory && existing.quantity >= product.stock) return prev;
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      if (!product.isNonInventory && product.stock <= 0) return prev;
      return [...prev, {
        productId: product.id,
        name: product.name,
        designation: product.designation,
        price: product.price,
        quantity: 1,
        storeId: product.storeId,
        storeName: product.storeName || 'Principal',
        isNonInventory: product.isNonInventory,
        isBreakage: product.isBreakage,
        isRepackaged: product.isRepackaged
      }];
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
    // Compute cashier letter code based on creation order
    const cashierList = [...users].filter(u => u.role === 'cashier').sort((a, b) => a.id - b.id);
    const cashierIdx = cashierList.findIndex(u => u.id === currentUser?.id);
    const cashierCode = cashierIdx >= 0 ? String.fromCharCode(65 + cashierIdx) : '?';
    const newCounter = (invoiceCounters[currentUser?.id] || 0) + 1;
    const invoiceNumber = `${cashierCode}-${String(newCounter).padStart(4, '0')}`;
    const sale = {
      id: allSales.length + 1,
      date: new Date().toISOString(),
      items: [...cart],
      total: cartTotal,
      paymentMethod,
      cashier: currentUser?.name || 'Inconnu',
      cashierCode,
      invoiceNumber,
      storeId: activeStoreId,
      deliveryStatus: 'pending',
      items: cart.map(item => ({ ...item, isDelivered: false, quantityDelivered: 0 })),
    };
    // Decrease stock for each product (except non-inventory)
    setAllProducts(prev => prev.map(p => {
      const cartItem = cart.find(item => item.productId === p.id);
      if (cartItem && !p.isNonInventory) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      }
      return p;
    }));
    setAllSales(prev => [sale, ...prev]);
    setInvoiceCounters(prev => ({ ...prev, [currentUser?.id]: newCounter }));
    setCart([]);
    return sale;
  }, [cart, cartTotal, currentUser, allSales.length, activeStoreId, invoiceCounters, users]);

  const initializeCashFund = useCallback((amount) => {
    // Retrouver la dernière clôture de ce caissier pour ce magasin
    const myLastReport = cashReports.find(r => r.cashier === (currentUser?.name || 'Inconnu') && r.storeId === activeStoreId);
    
    // Si une clôture précédente existe, la nouvelle session démarre exactement à l'heure de cette clôture.
    // Cela permet d'inclure toutes les factures faites entre la clôture et la nouvelle ouverture.
    const startDate = myLastReport ? myLastReport.date : new Date().toISOString();

    setInitialCashFund(amount);
    setIsCashFundInitialized(true);
    setCashInitializationDate(startDate);
    localStorage.setItem('initialCashFund', amount);
    localStorage.setItem('isCashFundInitialized', 'true');
    localStorage.setItem('cashInitializationDate', startDate);
  }, [cashReports, currentUser, activeStoreId]);

  const closeCashSession = useCallback((finalBalance, sessionStats = {}) => {
    const report = {
      id: Date.now(),
      date: new Date().toISOString(),
      cashier: currentUser?.name || 'Inconnu',
      storeId: activeStoreId,
      ...sessionStats,
      finalBalance
    };

    setCashReports(prev => {
      const next = [report, ...prev];
      localStorage.setItem('cashReports', JSON.stringify(next));
      return next;
    });

    setLastClosingBalance(finalBalance);
    setIsCashFundInitialized(false);
    setCashInitializationDate(null);
    localStorage.setItem('lastClosingBalance', finalBalance);
    localStorage.setItem('isCashFundInitialized', 'false');
    localStorage.removeItem('cashInitializationDate');
  }, [currentUser, activeStoreId]);

  const addExpense = useCallback((expense) => {
    setExpenses(prev => [{
      ...expense,
      id: Date.now(),
      date: new Date().toISOString(),
      cashier: currentUser?.name || 'Inconnu',
      storeId: activeStoreId
    }, ...prev]);
  }, [currentUser, activeStoreId]);

  const addVersement = useCallback((amount) => {
    setVersements(prev => [{
      id: Date.now(),
      amount,
      date: new Date().toISOString(),
      cashier: currentUser?.name || 'Inconnu',
      storeId: activeStoreId
    }, ...prev]);
  }, [currentUser, activeStoreId]);

  // Customer account management
  const addCustomer = useCallback((customerData) => {
    const newCustomer = {
      ...customerData,
      id: Date.now(),
      balance: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
    };
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  }, []);

  const addCustomerDeposit = useCallback((customerId, amount, method = 'Espèces') => {
    const txn = {
      id: Date.now(),
      customerId,
      type: 'deposit',
      amount,
      method,
      date: new Date().toISOString(),
      cashier: currentUser?.name || 'Inconnu',
      storeId: activeStoreId,
      reference: `DEP-${Date.now()}`,
    };
    setCustomers(prev => prev.map(c =>
      c.id === customerId ? { ...c, balance: c.balance + amount } : c
    ));
    setCustomerTransactions(prev => [txn, ...prev]);
    return txn;
  }, [currentUser, activeStoreId]);

  const refundCustomer = useCallback((customerId, amount) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || customer.balance < amount) return null;
    const txn = {
      id: Date.now(),
      customerId,
      type: 'refund',
      amount: -amount,
      method: 'Espèces',
      date: new Date().toISOString(),
      cashier: currentUser?.name || 'Inconnu',
      storeId: activeStoreId,
      reference: `RMB-${Date.now()}`,
    };
    setCustomers(prev => prev.map(c =>
      c.id === customerId ? { ...c, balance: c.balance - amount } : c
    ));
    setCustomerTransactions(prev => [txn, ...prev]);
    return txn;
  }, [customers, currentUser, activeStoreId]);

  // Calcul du solde de caisse actuel (Fond Initial + Ventes Espèces + Dépôts Espèces - Remboursements - Dépenses - Versements)
  const currentCashBalance = useMemo(() => {
    if (!isCashFundInitialized || !cashInitializationDate) return 0;
    const initDate = new Date(cashInitializationDate);

    const cashierSales = allSales.filter(s =>
      s.cashier === currentUser?.name &&
      (s.paymentMethod === 'Espèces' || s.paymentMethod === 'Mixte') &&
      new Date(s.date) >= initDate
    );
    const cashierExpenses = expenses.filter(e =>
      e.cashier === currentUser?.name &&
      new Date(e.date) >= initDate
    );
    const cashierVersements = versements.filter(v =>
      v.cashier === currentUser?.name &&
      new Date(v.date) >= initDate
    );
    // Dépôts clients en espèces
    const cashDeposits = customerTransactions.filter(t =>
      t.cashier === currentUser?.name &&
      t.type === 'deposit' &&
      t.method === 'Espèces' &&
      new Date(t.date) >= initDate
    );
    // Remboursements clients (toujours en espèces)
    const cashRefunds = customerTransactions.filter(t =>
      t.cashier === currentUser?.name &&
      t.type === 'refund' &&
      new Date(t.date) >= initDate
    );

    const totalSales = cashierSales.reduce((sum, s) => sum + (s.cashPaid || s.total), 0);
    const totalExpenses = cashierExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalVersements = cashierVersements.reduce((sum, v) => sum + v.amount, 0);
    const totalDeposits = cashDeposits.reduce((sum, t) => sum + t.amount, 0);
    const totalRefunds = cashRefunds.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return initialCashFund + totalSales + totalDeposits - totalExpenses - totalVersements - totalRefunds;
  }, [initialCashFund, isCashFundInitialized, cashInitializationDate, allSales, expenses, versements, currentUser, customerTransactions]);

  // Invoice sale: custom items + customer info + discount + optional account payment + initial partial payment + immediate delivery flag
  const completeInvoiceSale = useCallback((paymentMethod, customItems, customerInfo = {}, discount = 0, accountPayment = 0, initialPayment = null, immediateDelivery = false) => {
    if (!customItems || customItems.length === 0) return null;
    const itemsTotal = customItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const finalTotal = itemsTotal - discount;

    // Determine effective payment method label
    let effectiveMethod = paymentMethod;
    let cashPaid = finalTotal; // amount that physically enters the cash drawer
    let accountUsed = accountPayment;
    if (accountPayment > 0) {
      const remaining = finalTotal - accountPayment;
      if (remaining <= 0) {
        effectiveMethod = 'Compte Client';
        cashPaid = 0;
        accountUsed = finalTotal;
      } else {
        effectiveMethod = 'Mixte';
        cashPaid = remaining;
      }
    }

    if (initialPayment !== null) {
      cashPaid = initialPayment; // Override with the partial amount actually paid
      if (accountUsed === 0 && initialPayment < finalTotal) {
        effectiveMethod = paymentMethod; // e.g. Espèces, but partial
      }
    }

    const amountPaid = accountUsed + cashPaid;
    const amountDue = finalTotal - amountPaid;
    const paymentStatus = amountDue <= 0 ? 'fully_paid' : (amountPaid > 0 ? 'partial' : 'unpaid');

    const cashierList = [...users].filter(u => u.role === 'cashier').sort((a, b) => a.id - b.id);
    const cashierIdx = cashierList.findIndex(u => u.id === currentUser?.id);
    const cashierCode = cashierIdx >= 0 ? String.fromCharCode(65 + cashierIdx) : '?';
    const newCounter = (invoiceCounters[currentUser?.id] || 0) + 1;
    const invoiceNumber = `${cashierCode}-${String(newCounter).padStart(4, '0')}`;

    const paymentHistory = [];
    if (accountUsed > 0) {
      paymentHistory.push({
        id: Date.now() + 1,
        date: new Date().toISOString(),
        amount: accountUsed,
        method: 'Compte Client',
        cashier: currentUser?.name || 'Inconnu',
        reference: `PMT-${invoiceNumber}-ACT`
      });
    }
    if (cashPaid > 0) {
      paymentHistory.push({
        id: Date.now() + 2,
        date: new Date().toISOString(),
        amount: cashPaid,
        method: paymentMethod,
        cashier: currentUser?.name || 'Inconnu',
        reference: `PMT-${invoiceNumber}-CASH`
      });
    }
    
    const sale = {
      id: allSales.length + 1,
      date: new Date().toISOString(),
      items: customItems.map(item => ({ ...item, isDelivered: item.isDelivered ?? false, quantityDelivered: item.quantityDelivered ?? 0 })),
      itemsTotal,
      discount,
      total: finalTotal,
      paymentMethod: effectiveMethod,
      cashPaid,
      accountPayment,
      cashier: currentUser?.name || 'Inconnu',
      cashierCode,
      invoiceNumber,
      customerName: customerInfo.name || '',
      customerPhone: customerInfo.phone || '',
      customerId: customerInfo.id || null,
      storeId: activeStoreId,
      deliveryStatus: 'pending',
      deliveryUnlocked: immediateDelivery,
      amountPaid,
      amountDue,
      paymentStatus,
      paymentHistory,
    };

    // Deduct from customer balance if account was used
    if (accountPayment > 0 && customerInfo.id) {
      const usedAmount = Math.min(accountPayment, finalTotal);
      const txn = {
        id: Date.now(),
        customerId: customerInfo.id,
        type: 'purchase',
        amount: -usedAmount,
        method: 'Compte Client',
        date: sale.date,
        cashier: currentUser?.name || 'Inconnu',
        storeId: activeStoreId,
        reference: invoiceNumber,
      };
      setCustomers(prev => prev.map(c =>
        c.id === customerInfo.id
          ? { ...c, balance: Math.max(0, c.balance - usedAmount), totalSpent: c.totalSpent + finalTotal }
          : c
      ));
      setCustomerTransactions(prev => [txn, ...prev]);
    }

    setAllProducts(prev => prev.map(p => {
      const item = customItems.find(i => i.productId === p.id);
      if (item && !p.isNonInventory) {
        return { ...p, stock: Math.max(0, p.stock - item.quantity) };
      }
      return p;
    }));
    setAllSales(prev => [sale, ...prev]);
    setInvoiceCounters(prev => ({ ...prev, [currentUser?.id]: newCounter }));
    return sale;
  }, [currentUser, allSales.length, activeStoreId, invoiceCounters, users]);

  const totalRevenue = sales.filter(s => s.status !== 'cancelled').reduce((sum, s) => sum + s.total, 0);
  const todaySales = sales.filter(s => s.status !== 'cancelled' && new Date(s.date).toDateString() === new Date().toDateString());
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const totalStockValue = products.reduce((sum, p) => sum + p.cost * p.stock, 0);
  const activeStore = stores.find(s => s.id === activeStoreId);

  // All products from all stores enriched with storeName — for cashier multi-store POS
  const allCashierProducts = allProducts.map(p => ({
    ...p,
    storeName: stores.find(s => s.id === p.storeId)?.name || 'Principal',
  }));

  // Next invoice number for the current cashier
  const _cashierList = users.filter(u => u.role === 'cashier').sort((a, b) => a.id - b.id);
  const _cashierIdx = _cashierList.findIndex(u => u.id === currentUser?.id);
  const currentCashierCode = _cashierIdx >= 0 ? String.fromCharCode(65 + _cashierIdx) : '?';
  const nextInvoiceCount = (invoiceCounters[currentUser?.id] || 0) + 1;
  const nextInvoiceNumber = `${currentCashierCode}-${String(nextInvoiceCount).padStart(4, '0')}`;

  // Staff list with their letter codes (Cashiers & Storekeepers)
  const staffWithCodes = users
    .filter(u => u.role === 'cashier' || u.role === 'storekeeper')
    .sort((a, b) => a.id - b.id)
    .map((u, i) => ({ ...u, staffCode: String.fromCharCode(65 + i) }));

  // Function to validate delivery for a SPECIFIC STORE
  const deliverSale = useCallback((saleId, storeId) => {
    setAllSales(prev => {
      return prev.map(sale => {
        if (sale.id !== saleId) return sale;

        // Marquer les articles de ce magasin comme livrés
        const updatedItems = sale.items.map(item => {
          if (item.storeId === storeId) {
            // Déduire du stock physique si ce n'était pas déjà fait et si c'est pas un article hors-stock
            if (!item.isDelivered && !item.isNonInventory) {
              setAllProducts(pPrev => pPrev.map(p => 
                p.id === item.productId ? { ...p, physicalStock: Math.max(0, p.physicalStock - item.quantity) } : p
              ));
            }
            return { ...item, isDelivered: true };
          }
          return item;
        });

        // Vérifier si tous les articles de la facture (tous magasins confondus) sont livrés
        const allDelivered = updatedItems.every(i => i.isDelivered);

        return { 
          ...sale, 
          items: updatedItems, 
          deliveryStatus: allDelivered ? 'delivered' : 'partially_delivered' 
        };
      });
    });
  }, []);

  // Function to deliver a PARTIAL quantity per article
  const deliverPartial = useCallback((saleId, storeId, deliveries) => {
    // deliveries = [{productId, qtyNow}]
    setAllSales(prev => prev.map(sale => {
      if (sale.id !== saleId) return sale;

      const stockUpdates = {};

      const updatedItems = sale.items.map(item => {
        if (item.storeId !== storeId) return item;
        const delivery = deliveries.find(d => d.productId === item.productId);
        if (!delivery || delivery.qtyNow <= 0) return item;

        const alreadyDelivered = item.quantityDelivered ?? 0;
        const newDelivered = alreadyDelivered + delivery.qtyNow;
        const isNowDelivered = newDelivered >= item.quantity;

        stockUpdates[item.productId] = delivery.qtyNow;

        return { ...item, quantityDelivered: newDelivered, isDelivered: isNowDelivered };
      });

      // Deduct physical stock for each delivered quantity
      Object.entries(stockUpdates).forEach(([productId, qty]) => {
        setAllProducts(pPrev => pPrev.map(p => {
          if (p.id === parseInt(productId) && !p.isNonInventory) {
            return { ...p, physicalStock: Math.max(0, p.physicalStock - qty) };
          }
          return p;
        }));
      });

      // Recalculate global delivery status
      const allDelivered = updatedItems.every(i => i.isDelivered);
      const anyDelivered = updatedItems.some(i => (i.quantityDelivered ?? 0) > 0);
      const newStatus = allDelivered ? 'delivered' : anyDelivered ? 'partially_delivered' : 'pending';

      return { ...sale, items: updatedItems, deliveryStatus: newStatus };
    }));
  }, []);

  // Function to cancel a sale and restore stocks
  const cancelSale = useCallback((saleId) => {
    setAllSales(prev => {
      const sale = prev.find(s => s.id === saleId);
      if (!sale || sale.status === 'cancelled') return prev;

      // Restorer les stocks
      setAllProducts(pPrev => pPrev.map(p => {
        const item = sale.items.find(i => i.productId === p.id);
        if (item && !p.isNonInventory) {
          // On restaure le stock théorique
          let newStock = p.stock + item.quantity;
          // On restaure le stock physique uniquement en fonction de ce qui a été réellement sorti
          const qtyAlreadyOut = item.quantityDelivered ?? (item.isDelivered ? item.quantity : 0);
          let newPhysicalStock = p.physicalStock + qtyAlreadyOut;
          
          return { 
            ...p, 
            stock: newStock,
            physicalStock: newPhysicalStock
          };
        }
        return p;
      }));

      return prev.map(s => s.id === saleId ? { ...s, status: 'cancelled' } : s);
    });
  }, []);

  const recordInvoicePayment = useCallback((saleId, amount, method) => {
    let newTxn = null;
    setAllSales(prev => prev.map(sale => {
      if (sale.id !== saleId || sale.amountDue <= 0) return sale;
      const actualAmount = Math.min(amount, sale.amountDue || sale.total);
      
      const newAmountPaid = (sale.amountPaid || sale.total) + actualAmount;
      const newAmountDue = sale.total - newAmountPaid;
      const newPaymentStatus = newAmountDue <= 0 ? 'fully_paid' : 'partial';
      
      newTxn = {
        id: Date.now(),
        date: new Date().toISOString(),
        amount: actualAmount,
        method,
        cashier: currentUser?.name || 'Inconnu',
        reference: `PMT-${sale.invoiceNumber}-${(sale.paymentHistory?.length || 0) + 1}`
      };
      
      const newHistory = [...(sale.paymentHistory || []), newTxn];
      
      return {
        ...sale,
        amountPaid: newAmountPaid,
        amountDue: newAmountDue,
        paymentStatus: newPaymentStatus,
        paymentHistory: newHistory
      };
    }));
    return newTxn;
  }, [currentUser]);

  const unlockDelivery = useCallback((saleId) => {
    setAllSales(prev => prev.map(sale => 
      sale.id === saleId ? { ...sale, deliveryUnlocked: true } : sale
    ));
  }, []);
  
  const processReturn = useCallback((originalSale, itemsToReturn) => {
    if (!itemsToReturn || itemsToReturn.length === 0) return null;
    
    const returnTotal = itemsToReturn.reduce((s, i) => s + i.price * i.quantity, 0);
    
    const returnEntry = {
      id: allSales.length + 1,
      type: 'return',
      originalInvoiceNumber: originalSale.invoiceNumber,
      date: new Date().toISOString(),
      items: itemsToReturn.map(i => ({ ...i, quantity: -i.quantity })), // Quantités négatives pour le journal
      itemsTotal: -returnTotal,
      total: -returnTotal, // Montant négatif pour la caisse
      paymentMethod: originalSale.paymentMethod || 'Espèces',
      cashier: currentUser?.name || 'Inconnu',
      invoiceNumber: `RET-${originalSale.invoiceNumber}`,
      customerName: originalSale.customerName,
      storeId: activeStoreId,
      status: 'completed',
    };

    // Restaurer les stocks (Théorique + Physique car le client a ramené la marchandise)
    setAllProducts(prev => prev.map(p => {
      const returnedItem = itemsToReturn.find(i => i.productId === p.id);
      if (returnedItem && !p.isNonInventory) {
        return { 
          ...p, 
          stock: p.stock + returnedItem.quantity,
          physicalStock: p.physicalStock + returnedItem.quantity
        };
      }
      return p;
    }));

    setAllSales(prev => [returnEntry, ...prev]);
    return returnEntry;
  }, [currentUser, allSales.length, activeStoreId]);

  const createTransfer = useCallback((toStoreId, items, notes = '') => {
    if (!items || items.length === 0) return null;
    
    const newTransfer = {
      id: transfers.length + 1,
      reference: `TRF-${String(transfers.length + 1).padStart(4, '0')}`,
      date: new Date().toISOString(),
      fromStoreId: activeStoreId,
      toStoreId,
      status: 'in_transit',
      items,
      initiatedBy: currentUser?.name || 'Inconnu',
      receivedBy: null,
      receivedDate: null,
      notes
    };

    // Deduct stock immediately from origin store
    setAllProducts(prev => prev.map(p => {
      const transferItem = items.find(i => i.productId === p.id);
      if (transferItem && p.storeId === activeStoreId) {
        return { 
          ...p, 
          stock: Math.max(0, p.stock - transferItem.quantity),
          physicalStock: Math.max(0, p.physicalStock - transferItem.quantity)
        };
      }
      return p;
    }));

    setTransfers(prev => [newTransfer, ...prev]);
    return newTransfer;
  }, [transfers.length, activeStoreId, currentUser]);

  const receiveTransfer = useCallback((transferId) => {
    const transfer = transfers.find(t => t.id === transferId);
    if (!transfer || transfer.status !== 'in_transit') return;

    setTransfers(prev => prev.map(t => 
      t.id === transferId 
        ? { ...t, status: 'completed', receivedBy: currentUser?.name || 'Inconnu', receivedDate: new Date().toISOString() } 
        : t
    ));

    // Add stock to destination store
    setAllProducts(prev => {
      const newProducts = [...prev];
      let maxId = Math.max(...newProducts.map(p => p.id), 0);

      transfer.items.forEach(item => {
        // Find if product exists in destination store by name
        const existingProduct = newProducts.find(p => p.storeId === transfer.toStoreId && p.name === item.name);
        
        if (existingProduct) {
          existingProduct.stock += item.quantity;
          existingProduct.physicalStock += item.quantity;
        } else {
          // Clone the original product to the new store
          const originalProduct = prev.find(p => p.id === item.productId);
          if (originalProduct) {
            maxId++;
            newProducts.push({
              ...originalProduct,
              id: maxId,
              storeId: transfer.toStoreId,
              stock: item.quantity,
              physicalStock: item.quantity
            });
          }
        }
      });
      return newProducts;
    });
  }, [transfers, currentUser]);

  const value = {
    currentUser, login, logout,
    stores, activeStoreId, activeStore, addStore, switchStore, updateStore, deleteStore,
    products, addProduct, updateProduct, deleteProduct, bulkUpdateStock, categories, addCategory,
    cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartTotal, completeSale,
    sales, totalRevenue, todaySales, todayRevenue, lowStockProducts, totalStockValue,
    users, addUser, updateUser, toggleUserStatus,
    // Cashier multi-store & invoice features
    allCashierProducts, nextInvoiceNumber, currentCashierCode, staffWithCodes, invoiceCounters,
    completeInvoiceSale, expenses, addExpense, 
    initialCashFund, isCashFundInitialized, initializeCashFund, cashInitializationDate,
    versements, addVersement, currentCashBalance,
    allSales, deliverSale, deliverPartial, cancelSale, processReturn, recordInvoicePayment, unlockDelivery,
    lastClosingBalance, closeCashSession, cashReports,
    transfers, createTransfer, receiveTransfer,
    stockEntries,
    customers, customerTransactions, addCustomer, addCustomerDeposit, refundCustomer,
    // Nouvelles fonctionnalités Casses & Reconditionnements
    breakages, declareBreakage,
    repackagings, createRepackaging,
    // Company Settings
    companySettings, updateCompanySettings,
    // Theme Settings
    theme, toggleTheme
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};



export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
