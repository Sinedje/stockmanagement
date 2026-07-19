import mongoose from 'mongoose';

const transferItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true }
}, { _id: false });

const transferSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
  fromStoreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  toStoreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  status: { type: String, required: true, enum: ['in_transit', 'completed'], default: 'in_transit' },
  items: [transferItemSchema],
  initiatedBy: { type: String, required: true },
  receivedBy: { type: String, default: null },
  receivedDate: { type: Date, default: null },
  notes: { type: String, default: '' }
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      ret.fromStoreId = ret.fromStoreId?.toString();
      ret.toStoreId = ret.toStoreId?.toString();
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

export default mongoose.model('Transfer', transferSchema);
