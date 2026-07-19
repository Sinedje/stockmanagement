import mongoose from 'mongoose';

const repackagingSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  brokenProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  brokenProductName: { type: String, required: true },
  brokenQty: { type: Number, required: true },
  newProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  newProductName: { type: String, required: true },
  newProductQty: { type: Number, required: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true }
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      ret.brokenProductId = ret.brokenProductId?.toString();
      ret.newProductId = ret.newProductId?.toString();
      ret.storeId = ret.storeId?.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

export default mongoose.model('Repackaging', repackagingSchema);
