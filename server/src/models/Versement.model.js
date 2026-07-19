import mongoose from 'mongoose';

const versementSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  cashier: { type: String, required: true, trim: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true }
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

export default mongoose.model('Versement', versementSchema);
