import Sale from '../models/Sale.model.js';
import Product from '../models/Product.model.js';
import Customer from '../models/Customer.model.js';
import CustomerTransaction from '../models/CustomerTransaction.model.js';
import Expense from '../models/Expense.model.js';
import Versement from '../models/Versement.model.js';
import CashReport from '../models/CashReport.model.js';

// Helper to deduct stock
const adjustStock = async (items, multiplier = -1) => {
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (product && !product.isNonInventory) {
      product.stock += (item.quantity * multiplier);
      await product.save();
    }
  }
};

export const getSales = async (req, res, next) => {
  try {
    const sales = await Sale.find({});
    res.json(sales);
  } catch (error) {
    next(error);
  }
};

export const createSale = async (req, res, next) => {
  const saleData = req.body;
  try {
    // 1. Deduct stock for cashier sales (they are delivered instantly)
    if (saleData.deliveryStatus === 'delivered') {
      await adjustStock(saleData.items, -1);
    }

    // 2. Manage customer transactions if customerId is present
    if (saleData.customerId) {
      const customer = await Customer.findById(saleData.customerId);
      if (customer) {
        // If it's a deposit sale (saleData.type === 'deposit')
        if (saleData.type === 'deposit') {
          customer.balance += saleData.total;
          await customer.save();

          await CustomerTransaction.create({
            customerId: customer._id,
            type: 'deposit',
            amount: saleData.total,
            method: saleData.paymentMethod,
            reference: saleData.invoiceNumber,
            cashier: saleData.cashier,
            storeId: saleData.storeId
          });
        } else {
          // Normal sale, track amount spent
          customer.totalSpent += saleData.amountPaid || 0;
          
          // Deduct from balance if customer used account credit
          if (saleData.paymentMethod === 'Compte') {
            customer.balance -= saleData.total;
            
            await CustomerTransaction.create({
              customerId: customer._id,
              type: 'sale',
              amount: -saleData.total,
              method: 'Compte',
              reference: saleData.invoiceNumber,
              cashier: saleData.cashier,
              storeId: saleData.storeId
            });
          } else if (saleData.amountDue > 0) {
            // Deduct due amount from customer balance if unpaid/partial invoice
            customer.balance -= saleData.amountDue;
            
            await CustomerTransaction.create({
              customerId: customer._id,
              type: 'sale',
              amount: -saleData.amountDue,
              method: 'Dette',
              reference: saleData.invoiceNumber,
              cashier: saleData.cashier,
              storeId: saleData.storeId
            });
          }
          await customer.save();
        }
      }
    }

    // Create the sale
    const sale = await Sale.create(saleData);
    res.status(201).json(sale);
  } catch (error) {
    next(error);
  }
};

export const createInvoiceSale = async (req, res, next) => {
  // Invoice sale is structurally the same as createSale but could have custom fields
  return createSale(req, res, next);
};

export const cancelSale = async (req, res, next) => {
  const { id } = req.params;
  try {
    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ message: 'Vente non trouvée' });
    }

    if (sale.status === 'cancelled') {
      return res.status(400).json({ message: 'Cette vente est déjà annulée' });
    }

    // Restore stock if the items were already delivered
    if (sale.deliveryStatus === 'delivered' || sale.deliveryStatus === 'partially_delivered') {
      // Restore items based on what was actually delivered
      const restoredItems = sale.items.map(item => ({
        productId: item.productId,
        quantity: item.isDelivered ? item.quantity : (item.quantityDelivered || 0)
      }));
      await adjustStock(restoredItems, 1);
    }

    // Restore customer balance if it was a credit sale or deposit
    if (sale.customerId) {
      const customer = await Customer.findById(sale.customerId);
      if (customer) {
        if (sale.type === 'deposit') {
          customer.balance -= sale.total;
          await CustomerTransaction.create({
            customerId: customer._id,
            type: 'refund',
            amount: -sale.total,
            method: sale.paymentMethod,
            reference: `ANNULATION-${sale.invoiceNumber}`,
            cashier: req.user.name,
            storeId: sale.storeId
          });
        } else if (sale.paymentMethod === 'Compte') {
          customer.balance += sale.total;
          await CustomerTransaction.create({
            customerId: customer._id,
            type: 'refund',
            amount: sale.total,
            method: 'Compte',
            reference: `ANNULATION-${sale.invoiceNumber}`,
            cashier: req.user.name,
            storeId: sale.storeId
          });
        } else if (sale.amountDue > 0) {
          customer.balance += sale.amountDue;
          await CustomerTransaction.create({
            customerId: customer._id,
            type: 'refund',
            amount: sale.amountDue,
            method: 'Dette',
            reference: `ANNULATION-${sale.invoiceNumber}`,
            cashier: req.user.name,
            storeId: sale.storeId
          });
        }
        await customer.save();
      }
    }

    sale.status = 'cancelled';
    await sale.save();
    res.json(sale);
  } catch (error) {
    next(error);
  }
};

export const recordPayment = async (req, res, next) => {
  const { id } = req.params;
  const { amount, method } = req.body;
  try {
    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ message: 'Vente non trouvée' });
    }

    const val = parseFloat(amount) || 0;
    if (val <= 0 || val > sale.amountDue) {
      return res.status(400).json({ message: 'Montant de paiement invalide' });
    }

    sale.amountPaid += val;
    sale.amountDue -= val;
    
    if (sale.amountDue === 0) {
      sale.paymentStatus = 'fully_paid';
    } else {
      sale.paymentStatus = 'partial';
    }

    sale.paymentHistory.push({
      date: new Date(),
      amount: val,
      method,
      cashier: req.user.name,
      reference: `Paiement sur facture ${sale.invoiceNumber}`
    });

    // Update customer credit/debt balance
    if (sale.customerId) {
      const customer = await Customer.findById(sale.customerId);
      if (customer) {
        customer.balance += val; // reduce debt by adding paid value back
        customer.totalSpent += val;
        await customer.save();

        await CustomerTransaction.create({
          customerId: customer._id,
          type: 'deposit',
          amount: val,
          method,
          reference: `REGLEMENT-${sale.invoiceNumber}`,
          cashier: req.user.name,
          storeId: sale.storeId
        });
      }
    }

    await sale.save();
    res.json(sale);
  } catch (error) {
    next(error);
  }
};

export const processReturn = async (req, res, next) => {
  const { id } = req.params; // Original sale ID
  const { items } = req.body; // Array of { productId, quantity }
  try {
    const originalSale = await Sale.findById(id);
    if (!originalSale) {
      return res.status(404).json({ message: 'Vente originale non trouvée' });
    }

    // 1. Restore stocks
    for (const returnItem of items) {
      const product = await Product.findById(returnItem.productId);
      if (product && !product.isNonInventory) {
        product.stock += returnItem.quantity;
        await product.save();
      }
    }

    // 2. Adjust original sale items count/delivered status if needed
    // Create a new return sale transaction to log the return
    const returnTotal = items.reduce((sum, item) => {
      const origItem = originalSale.items.find(i => i.productId.toString() === item.productId);
      return sum + (origItem ? origItem.price * item.quantity : 0);
    }, 0);

    const returnSaleData = {
      items: items.map(item => {
        const origItem = originalSale.items.find(i => i.productId.toString() === item.productId);
        return {
          productId: item.productId,
          name: origItem ? origItem.name : 'Produit retourné',
          price: origItem ? origItem.price : 0,
          quantity: item.quantity,
          storeId: originalSale.storeId,
          isDelivered: true,
          quantityDelivered: item.quantity
        };
      }),
      total: -returnTotal,
      paymentMethod: originalSale.paymentMethod,
      cashier: req.user.name,
      invoiceNumber: `RET-${originalSale.invoiceNumber}-${Date.now().toString().slice(-4)}`,
      storeId: originalSale.storeId,
      deliveryStatus: 'delivered',
      status: 'completed',
      type: 'return',
      originalInvoiceNumber: originalSale.invoiceNumber
    };

    // If there is customer credit to refund
    if (originalSale.customerId) {
      const customer = await Customer.findById(originalSale.customerId);
      if (customer) {
        customer.balance += returnTotal; // add credit back to customer
        await customer.save();

        await CustomerTransaction.create({
          customerId: customer._id,
          type: 'refund',
          amount: returnTotal,
          method: originalSale.paymentMethod,
          reference: returnSaleData.invoiceNumber,
          cashier: req.user.name,
          storeId: originalSale.storeId
        });
      }
    }

    const returnSale = await Sale.create(returnSaleData);
    res.json(returnSale);
  } catch (error) {
    next(error);
  }
};

export const deliverSale = async (req, res, next) => {
  const { id } = req.params;
  try {
    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ message: 'Vente non trouvée' });
    }

    // Only deduct stock for items not yet delivered
    const itemsToDeliver = [];
    sale.items.forEach(item => {
      if (!item.isDelivered) {
        const remaining = item.quantity - (item.quantityDelivered || 0);
        if (remaining > 0) {
          itemsToDeliver.push({
            productId: item.productId,
            quantity: remaining
          });
          item.isDelivered = true;
          item.quantityDelivered = item.quantity;
        }
      }
    });

    await adjustStock(itemsToDeliver, -1);
    sale.deliveryStatus = 'delivered';
    await sale.save();
    res.json(sale);
  } catch (error) {
    next(error);
  }
};

export const deliverPartial = async (req, res, next) => {
  const { id } = req.params;
  const { deliveries } = req.body; // Object mapping { [productId]: qtyToDeliverNow }
  try {
    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ message: 'Vente non trouvée' });
    }

    const itemsToDeliver = [];
    let allDone = true;

    sale.items.forEach(item => {
      const pId = item.productId.toString();
      const deliverQty = parseInt(deliveries[pId]) || 0;

      if (deliverQty > 0) {
        const alreadyDelivered = item.quantityDelivered || 0;
        const target = Math.min(item.quantity - alreadyDelivered, deliverQty);
        
        if (target > 0) {
          itemsToDeliver.push({
            productId: item.productId,
            quantity: target
          });
          item.quantityDelivered = alreadyDelivered + target;
        }
      }

      if (item.quantityDelivered < item.quantity) {
        allDone = false;
        item.isDelivered = false;
      } else {
        item.isDelivered = true;
      }
    });

    await adjustStock(itemsToDeliver, -1);
    sale.deliveryStatus = allDone ? 'delivered' : 'partially_delivered';
    await sale.save();
    res.json(sale);
  } catch (error) {
    next(error);
  }
};

export const unlockDelivery = async (req, res, next) => {
  const { id } = req.params;
  try {
    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ message: 'Vente non trouvée' });
    }
    sale.deliveryUnlocked = true;
    await sale.save();
    res.json(sale);
  } catch (error) {
    next(error);
  }
};

// ── Expenses ──────────────────────────────────────────────────
export const createExpense = async (req, res, next) => {
  try {
    const expense = await Expense.create(req.body);
    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
};

// ── Versements ────────────────────────────────────────────────
export const createVersement = async (req, res, next) => {
  try {
    const versement = await Versement.create(req.body);
    res.status(201).json(versement);
  } catch (error) {
    next(error);
  }
};

// ── Cash Sessions ─────────────────────────────────────────────
export const initCashFund = async (req, res, next) => {
  // We simulate recording or fetching the status. No-op for DB or can be stored
  res.json(req.body);
};

export const closeCashSession = async (req, res, next) => {
  try {
    const report = await CashReport.create(req.body);
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};

export const getCashReports = async (req, res, next) => {
  try {
    const reports = await CashReport.find({});
    res.json(reports);
  } catch (error) {
    next(error);
  }
};
