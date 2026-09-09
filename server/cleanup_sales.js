import dns from 'dns';
dns.setServers(['1.1.1.1', '1.0.0.1']);
import mongoose from 'mongoose';
import Sale from './src/models/Sale.model.js';
import Product from './src/models/Product.model.js';
import Customer from './src/models/Customer.model.js';
import CustomerTransaction from './src/models/CustomerTransaction.model.js';

const uri = 'mongodb+srv://sinedjemanoel_db_user:tDJ0ChCXdfbKons6@cluster0.qia5bxl.mongodb.net/stock_management?retryWrites=true&w=majority&appName=Cluster0';

async function cleanup() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');
    
    // Find sales made by Hornel
    const sales = await Sale.find({ cashier: { $regex: /HORNEL/i } });
    console.log(`Found ${sales.length} sales to delete.`);
    
    for (const sale of sales) {
      console.log(`Processing sale: ${sale.invoiceNumber} - Items: ${sale.items.length}`);
      
      // RESTORE STOCK (using the same logic as cancelSale controller)
      if (sale.deliveryStatus === 'delivered' || sale.deliveryStatus === 'partially_delivered') {
        for (const item of sale.items) {
          const qtyToRestore = item.isDelivered ? item.quantity : (item.quantityDelivered || 0);
          if (qtyToRestore > 0) {
             const product = await Product.findById(item.productId);
             if (product && !product.isNonInventory) {
                product.stock += qtyToRestore;
                await product.save();
                console.log(` Restored ${qtyToRestore} for product ${product.name}`);
             }
          }
        }
      }
      
      // RESTORE CUSTOMER BALANCE (using the same logic as cancelSale controller)
      if (sale.customerId) {
        const customer = await Customer.findById(sale.customerId);
        if (customer) {
          if (sale.type === 'deposit') {
            customer.balance -= sale.total;
            await CustomerTransaction.deleteMany({ reference: sale.invoiceNumber });
          } else if (sale.paymentMethod === 'Compte') {
            customer.balance += sale.total;
            await CustomerTransaction.deleteMany({ reference: sale.invoiceNumber });
          } else if (sale.amountDue > 0) {
            customer.balance += sale.amountDue;
            await CustomerTransaction.deleteMany({ reference: sale.invoiceNumber });
          }
          await customer.save();
          console.log(` Restored balance for customer ${customer.name}`);
        }
      }
      
      // DELETE SALE
      await Sale.findByIdAndDelete(sale._id);
      console.log(` DELETED sale ${sale.invoiceNumber}`);
    }
    
    console.log('CLEANUP COMPLETE');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

cleanup();
