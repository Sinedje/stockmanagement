import Customer from '../models/Customer.model.js';
import CustomerTransaction from '../models/CustomerTransaction.model.js';

export const getCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find({});
    res.json(customers);
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const transactions = await CustomerTransaction.find({});
    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

export const recordDeposit = async (req, res, next) => {
  const { id } = req.params;
  const { amount, method } = req.body;
  try {
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    const val = parseFloat(amount) || 0;
    if (val <= 0) {
      return res.status(400).json({ message: 'Montant invalide' });
    }

    customer.balance += val;
    await customer.save();

    const transaction = await CustomerTransaction.create({
      customerId: customer._id,
      type: 'deposit',
      amount: val,
      method: method || 'Espèces',
      reference: `DEPOT-${Date.now().toString().slice(-6)}`,
      cashier: req.user.name,
      storeId: req.user.storeId
    });

    res.json({ customer, transaction });
  } catch (error) {
    next(error);
  }
};

export const recordRefund = async (req, res, next) => {
  const { id } = req.params;
  const { amount, method } = req.body;
  try {
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    const val = parseFloat(amount) || 0;
    if (val <= 0 || val > customer.balance) {
      return res.status(400).json({ message: 'Montant de remboursement invalide ou supérieur au solde disponible' });
    }

    customer.balance -= val;
    await customer.save();

    const transaction = await CustomerTransaction.create({
      customerId: customer._id,
      type: 'refund',
      amount: -val,
      method: method || 'Espèces',
      reference: `REMBOURSEMENT-${Date.now().toString().slice(-6)}`,
      cashier: req.user.name,
      storeId: req.user.storeId
    });

    res.json({ customer, transaction });
  } catch (error) {
    next(error);
  }
};
