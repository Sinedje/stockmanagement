import Product from '../models/Product.model.js';
import Category from '../models/Category.model.js';

// ── Products ──────────────────────────────────────────────────
export const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  const { id } = req.params;
  try {
    const product = await Product.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  const { id } = req.params;
  try {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    res.json({ id });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateStock = async (req, res, next) => {
  const { updates } = req.body; // Array of { id, quantity }
  try {
    const updatedProducts = [];
    for (const update of updates) {
      const product = await Product.findById(update.id);
      if (product) {
        product.stock += update.quantity;
        await product.save();
        updatedProducts.push(product);
      }
    }
    res.json(updatedProducts);
  } catch (error) {
    next(error);
  }
};

// ── Categories ────────────────────────────────────────────────
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  const { name } = req.body;
  try {
    const category = await Category.create({ name });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};
