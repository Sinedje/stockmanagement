import mongoose from 'mongoose';

const inventoryAdjustmentSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional, in case the frontend doesn't send it easily
  userName: { type: String, required: true }, // The name of the user who validated the inventory
  oldStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  discrepancy: { type: Number, required: true }, // newStock - oldStock
  reason: { type: String, default: 'Inventaire Physique' },
  date: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      ret.productId = ret.productId?.toString();
      ret.storeId = ret.storeId?.toString();
      if(ret.userId) ret.userId = ret.userId.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

export default mongoose.model('InventoryAdjustment', inventoryAdjustmentSchema);
