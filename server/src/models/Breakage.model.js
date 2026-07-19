import mongoose from 'mongoose';

const breakageSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  reason: { type: String, required: true, trim: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true }
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      ret.productId = ret.productId?.toString();
      ret.storeId = ret.storeId?.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

export default mongoose.model('Breakage', breakageSchema);
