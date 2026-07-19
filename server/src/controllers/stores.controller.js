import Store from '../models/Store.model.js';
import Transfer from '../models/Transfer.model.js';
import StockEntry from '../models/StockEntry.model.js';
import Product from '../models/Product.model.js';

// ── Stores ────────────────────────────────────────────────────
export const getStores = async (req, res, next) => {
  try {
    const stores = await Store.find({});
    res.json(stores);
  } catch (error) {
    next(error);
  }
};

export const createStore = async (req, res, next) => {
  try {
    const store = await Store.create(req.body);
    res.status(201).json(store);
  } catch (error) {
    next(error);
  }
};

export const updateStore = async (req, res, next) => {
  const { id } = req.params;
  try {
    const store = await Store.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!store) {
      return res.status(404).json({ message: 'Magasin non trouvé' });
    }
    res.json(store);
  } catch (error) {
    next(error);
  }
};

export const deleteStore = async (req, res, next) => {
  const { id } = req.params;
  try {
    const store = await Store.findByIdAndDelete(id);
    if (!store) {
      return res.status(404).json({ message: 'Magasin non trouvé' });
    }
    res.json({ id });
  } catch (error) {
    next(error);
  }
};

// ── Transfers ─────────────────────────────────────────────────
export const getTransfers = async (req, res, next) => {
  try {
    const transfers = await Transfer.find({});
    res.json(transfers);
  } catch (error) {
    next(error);
  }
};

export const createTransfer = async (req, res, next) => {
  const { fromStoreId, toStoreId, items, reference, initiatedBy, notes } = req.body;
  try {
    // 1. Check if source store has enough stock and deduct it
    for (const item of items) {
      const sourceProduct = await Product.findOne({ name: item.name, storeId: fromStoreId });
      if (!sourceProduct || sourceProduct.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Stock insuffisant pour le produit ${item.name} dans le magasin source` 
        });
      }
      sourceProduct.stock -= item.quantity;
      await sourceProduct.save();
      // Set the proper productId inside item for database reference
      item.productId = sourceProduct._id;
    }

    const transfer = await Transfer.create({
      reference,
      fromStoreId,
      toStoreId,
      items,
      initiatedBy,
      notes
    });

    res.status(201).json(transfer);
  } catch (error) {
    next(error);
  }
};

export const receiveTransfer = async (req, res, next) => {
  const { id } = req.params;
  const { receivedBy } = req.body;
  try {
    const transfer = await Transfer.findById(id);
    if (!transfer) {
      return res.status(404).json({ message: 'Transfert non trouvé' });
    }

    if (transfer.status === 'completed') {
      return res.status(400).json({ message: 'Ce transfert est déjà réceptionné' });
    }

    // 1. Add stock to target store. Find the matching product name in target store, or create it.
    for (const item of transfer.items) {
      // Find source product to get category, price, cost details
      const sourceProduct = await Product.findById(item.productId);
      if (!sourceProduct) {
        return res.status(404).json({ message: `Produit source ${item.name} introuvable` });
      }

      let destProduct = await Product.findOne({ name: item.name, storeId: transfer.toStoreId });
      if (!destProduct) {
        // Create product clone in destination store
        destProduct = await Product.create({
          name: sourceProduct.name,
          designation: sourceProduct.designation,
          category: sourceProduct.category,
          price: sourceProduct.price,
          cost: sourceProduct.cost,
          minStock: sourceProduct.minStock,
          image: sourceProduct.image,
          storeId: transfer.toStoreId,
          stock: item.quantity,
          physicalStock: item.quantity
        });
      } else {
        destProduct.stock += item.quantity;
        await destProduct.save();
      }
    }

    transfer.status = 'completed';
    transfer.receivedBy = receivedBy;
    transfer.receivedDate = new Date();
    await transfer.save();

    res.json(transfer);
  } catch (error) {
    next(error);
  }
};

// ── Stock Entries ─────────────────────────────────────────────
export const getStockEntries = async (req, res, next) => {
  const { storeId } = req.query;
  try {
    const filter = storeId ? { storeId } : {};
    const entries = await StockEntry.find(filter);
    res.json(entries);
  } catch (error) {
    next(error);
  }
};

export const createStockEntry = async (req, res, next) => {
  const { supplier, noteNumber, items, storeId } = req.body;
  try {
    // 1. Create or update product stock inside the targeted store
    const finalizedItems = [];
    for (const item of items) {
      let product;
      if (item.productId) {
        product = await Product.findById(item.productId);
      } else {
        // Find by name in the store
        product = await Product.findOne({ name: item.name, storeId });
      }

      if (!product) {
        // Create product if not existing (e.g. catalog management was done or directly entry-level)
        product = await Product.create({
          name: item.name,
          category: item.category || 'Général',
          price: item.price || (item.cost * 1.3), // default markup of 30% if undefined
          cost: item.cost,
          stock: item.quantity,
          physicalStock: item.quantity,
          storeId
        });
      } else {
        product.stock += item.quantity;
        product.cost = item.cost; // Update last purchase cost
        if (item.price) product.price = item.price; // Update price if supplied
        await product.save();
      }

      finalizedItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        cost: item.cost
      });
    }

    const entry = await StockEntry.create({
      supplier,
      noteNumber,
      items: finalizedItems,
      storeId
    });

    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
};
