import Breakage from '../models/Breakage.model.js';
import Repackaging from '../models/Repackaging.model.js';
import Product from '../models/Product.model.js';

// ── Breakages ─────────────────────────────────────────────────
export const getBreakages = async (req, res, next) => {
  try {
    const breakages = await Breakage.find({});
    res.json(breakages);
  } catch (error) {
    next(error);
  }
};

export const createBreakage = async (req, res, next) => {
  const { productId, quantity, reason, storeId } = req.body;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: `Stock insuffisant (${product.stock}) pour déclarer cette casse de ${quantity} unités` });
    }

    // Deduct stock
    product.stock -= quantity;
    await product.save();

    const breakage = await Breakage.create({
      productId,
      productName: product.name,
      quantity,
      reason,
      storeId
    });

    res.status(201).json(breakage);
  } catch (error) {
    next(error);
  }
};

// ── Repackagings ──────────────────────────────────────────────
export const getRepackagings = async (req, res, next) => {
  try {
    const repackagings = await Repackaging.find({});
    res.json(repackagings);
  } catch (error) {
    next(error);
  }
};

export const createRepackaging = async (req, res, next) => {
  const { brokenProductId, brokenQty, newProductId, newProductQty, storeId } = req.body;
  try {
    const sourceProduct = await Product.findById(brokenProductId);
    const destProduct = await Product.findById(newProductId);

    if (!sourceProduct || !destProduct) {
      return res.status(404).json({ message: 'L\'un des produits est introuvable' });
    }

    if (sourceProduct.stock < brokenQty) {
      return res.status(400).json({ message: `Stock insuffisant (${sourceProduct.stock}) pour le produit à reconditionner` });
    }

    // Adjust stocks
    sourceProduct.stock -= brokenQty;
    destProduct.stock += newProductQty;

    await sourceProduct.save();
    await destProduct.save();

    const repackaging = await Repackaging.create({
      brokenProductId,
      brokenProductName: sourceProduct.name,
      brokenQty,
      newProductId,
      newProductName: destProduct.name,
      newProductQty,
      storeId
    });

    res.status(201).json(repackaging);
  } catch (error) {
    next(error);
  }
};
