import mongoose from 'mongoose';

const cashReportSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  cashier: { type: String, required: true, trim: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  initialCashFund: { type: Number, required: true },
  totalSales: { type: Number, required: true },
  totalExpenses: { type: Number, required: true },
  totalVersements: { type: Number, required: true },
  finalBalance: { type: Number, required: true },
  discrepancy: { type: Number, required: true },
  notes: { type: String, default: '' },
  invoiceRange: { type: String, default: '' }
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

export default mongoose.model('CashReport', cashReportSchema);
