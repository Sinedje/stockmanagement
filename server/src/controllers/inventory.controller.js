import InventoryAdjustment from '../models/InventoryAdjustment.model.js';
import Product from '../models/Product.model.js';
import Sale from '../models/Sale.model.js';
import StockEntry from '../models/StockEntry.model.js';
import Transfer from '../models/Transfer.model.js';
import Breakage from '../models/Breakage.model.js';
import Repackaging from '../models/Repackaging.model.js';

export const logAdjustment = async (req, res, next) => {
  try {
    const adjustment = new InventoryAdjustment(req.body);
    await adjustment.save();
    res.status(201).json(adjustment);
  } catch (error) {
    next(error);
  }
};

export const logBulkAdjustments = async (req, res, next) => {
  try {
    const { adjustments } = req.body;
    
    // Process each adjustment to update Product stocks correctly
    for (const adj of adjustments) {
      const product = await Product.findById(adj.productId);
      if (product) {
        // The difference between physical and theoretical stock represents undelivered items
        const undeliveredQuantity = (product.physicalStock ?? product.stock) - product.stock;
        
        // Update physical stock to the new counted value
        product.physicalStock = adj.newStock;
        
        // Update theoretical stock to physical - undelivered
        product.stock = adj.newStock - Math.max(0, undeliveredQuantity);
        
        await product.save();
      }
    }
    
    const inserted = await InventoryAdjustment.insertMany(adjustments);
    res.status(201).json(inserted);
  } catch (error) {
    next(error);
  }
};

export const getAdjustments = async (req, res, next) => {
  try {
    const adjustments = await InventoryAdjustment.find().sort({ date: -1 });
    res.json(adjustments);
  } catch (error) {
    next(error);
  }
};

export const getGlobalHistory = async (req, res, next) => {
  try {
    // We want to fetch all movements and return them sorted by date.
    // Instead of doing it here, we will fetch and map them to a unified format.
    
    // 1. Inventory Adjustments
    const adjustments = await InventoryAdjustment.find().populate('productId', 'name').lean();
    
    // 2. Stock Entries
    const entries = await StockEntry.find().populate('items.productId', 'name').lean();
    
    // 3. Sales
    const sales = await Sale.find({ status: { $ne: 'cancelled' } }).populate('items.productId', 'name').lean();
    
    // 4. Transfers
    const transfers = await Transfer.find().populate('items.productId', 'name').lean();
    
    // 5. Breakages
    const breakages = await Breakage.find().populate('productId', 'name').lean();
    
    // 6. Repackagings
    const repackagings = await Repackaging.find().populate('sourceProductId', 'name').populate('targetProductId', 'name').lean();

    const history = [];

    // Process Adjustments
    adjustments.forEach(adj => {
      history.push({
        date: adj.date,
        type: 'Ajustement Inventaire',
        reference: adj.userName || 'Admin',
        productName: adj.productId?.name || 'Inconnu',
        quantity: adj.discrepancy > 0 ? `+${adj.discrepancy}` : `${adj.discrepancy}`,
        storeId: adj.storeId,
        details: `Ancien: ${adj.oldStock}, Nouveau: ${adj.newStock}`
      });
    });

    // Process Stock Entries
    entries.forEach(entry => {
      entry.items.forEach(item => {
        history.push({
          date: entry.date,
          type: 'Entrée Fournisseur',
          reference: entry.supplier || entry.reference || 'N/A',
          productName: item.productId?.name || item.name || 'Inconnu',
          quantity: `+${item.quantity}`,
          storeId: entry.storeId,
          details: `Coût unitaire: ${item.unitCost}`
        });
      });
    });

    // Process Sales
    sales.forEach(sale => {
      sale.items.forEach(item => {
        history.push({
          date: sale.date,
          type: sale.type === 'return' ? 'Retour Vente' : 'Vente',
          reference: sale.invoiceNumber || sale.id || 'N/A',
          productName: item.productId?.name || item.name || 'Inconnu',
          quantity: sale.type === 'return' ? `+${item.quantity}` : `-${item.quantity}`,
          storeId: sale.storeId,
          details: `Caissier: ${sale.cashier}`
        });
      });
    });

    // Process Transfers
    transfers.forEach(transfer => {
      transfer.items.forEach(item => {
        // Outgoing
        history.push({
          date: transfer.date,
          type: 'Transfert (Sortie)',
          reference: transfer.reference || 'N/A',
          productName: item.productId?.name || item.name || 'Inconnu',
          quantity: `-${item.quantity}`,
          storeId: transfer.fromStoreId,
          details: `Vers magasin ${transfer.toStoreId}`
        });
        // Incoming
        if (transfer.status === 'completed') {
          history.push({
            date: transfer.receivedDate || transfer.date,
            type: 'Transfert (Entrée)',
            reference: transfer.reference || 'N/A',
            productName: item.productId?.name || item.name || 'Inconnu',
            quantity: `+${item.quantity}`,
            storeId: transfer.toStoreId,
            details: `Depuis magasin ${transfer.fromStoreId}`
          });
        }
      });
    });

    // Process Breakages
    breakages.forEach(b => {
      history.push({
        date: b.date,
        type: 'Casse',
        reference: b.reportedBy || 'N/A',
        productName: b.productId?.name || 'Inconnu',
        quantity: `-${b.quantity}`,
        storeId: b.storeId,
        details: b.reason || ''
      });
    });

    // Process Repackagings
    repackagings.forEach(r => {
      // Source out
      history.push({
        date: r.date,
        type: 'Reconditionnement (Sortie)',
        reference: r.performedBy || 'N/A',
        productName: r.sourceProductId?.name || 'Inconnu',
        quantity: `-${r.sourceQuantity}`,
        storeId: r.storeId,
        details: `Converti en ${r.targetProductId?.name}`
      });
      // Target in
      history.push({
        date: r.date,
        type: 'Reconditionnement (Entrée)',
        reference: r.performedBy || 'N/A',
        productName: r.targetProductId?.name || 'Inconnu',
        quantity: `+${r.targetQuantity}`,
        storeId: r.storeId,
        details: `Provenant de ${r.sourceProductId?.name}`
      });
    });

    // Sort globally by date descending
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(history);
  } catch (error) {
    next(error);
  }
};
