import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
  isDelivered: { type: Boolean, default: false },
  quantityDelivered: { type: Number, default: 0 }
}, { _id: false });

const paymentHistoryEntrySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  cashier: { type: String, required: true },
  reference: { type: String, default: '' }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  items: [saleItemSchema],
  total: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  cashier: { type: String, required: true },
  invoiceNumber: { type: String, required: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  deliveryStatus: { type: String, required: true, enum: ['pending', 'partially_delivered', 'delivered'], default: 'pending' },
  status: { type: String, required: true, enum: ['completed', 'cancelled'], default: 'completed' },
  customerName: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  amountPaid: { type: Number, default: 0 },
  amountDue: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['fully_paid', 'partial', 'unpaid'], default: 'fully_paid' },
  paymentHistory: [paymentHistoryEntrySchema],
  deliveryUnlocked: { type: Boolean, default: false },
  type: { type: String, enum: ['sale', 'return', 'deposit', 'refund'], default: 'sale' },
  originalInvoiceNumber: { type: String, default: '' },
  itemsTotal: { type: Number, default: 0 }
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      ret.storeId = ret.storeId?.toString();
      ret.customerId = ret.customerId?.toString();
      if (ret.items) {
        ret.items = ret.items.map(item => ({
          ...item,
          productId: item.productId?.toString(),
          storeId: item.storeId?.toString()
        }));
      }
      delete ret._id;
      delete ret.__v;
    }
  }
});

// Enforce unique invoice number for valid sales
saleSchema.index({ invoiceNumber: 1 }, { unique: true, partialFilterExpression: { status: 'completed' } });

export default mongoose.model('Sale', saleSchema);
