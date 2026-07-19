import mongoose from 'mongoose';

const stockEntryItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  cost: { type: Number, required: true }
}, { _id: false });

const stockEntrySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  supplier: { type: String, required: true, trim: true },
  noteNumber: { type: String, required: true, trim: true },
  items: [stockEntryItemSchema],
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true }
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      ret.storeId = ret.storeId?.toString();
      if (ret.items) {
        ret.items = ret.items.map(item => ({
          ...item,
          productId: item.productId?.toString()
        }));
      }
      delete ret._id;
      delete ret.__v;
    }
  }
});

export default mongoose.model('StockEntry', stockEntrySchema);
