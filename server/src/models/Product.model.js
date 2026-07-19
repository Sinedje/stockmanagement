import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  designation: { type: String, default: '', trim: true },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  cost: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  physicalStock: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 },
  image: { type: String, default: '' },
  supplier: { type: String, default: '', trim: true },
  deliveryNote: { type: String, default: '', trim: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  isNonInventory: { type: Boolean, default: false }
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      ret.storeId = ret.storeId?.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

// Compound unique index for name and storeId to allow same product name in different stores
productSchema.index({ name: 1, storeId: 1 }, { unique: true });

export default mongoose.model('Product', productSchema);
