import mongoose from 'mongoose';

const customerTransactionSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  type: { type: String, required: true, enum: ['deposit', 'refund', 'sale'] },
  amount: { type: Number, required: true },
  method: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  reference: { type: String, required: true },
  cashier: { type: String, default: '' },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null }
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      ret.customerId = ret.customerId?.toString();
      ret.storeId = ret.storeId?.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

export default mongoose.model('CustomerTransaction', customerTransactionSchema);
