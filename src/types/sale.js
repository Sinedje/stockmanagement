/**
 * @typedef {Object} SaleItem
 * @property {number} productId
 * @property {string} name
 * @property {number} price
 * @property {number} quantity
 * @property {number} [storeId]
 * @property {boolean} [isDelivered]
 * @property {number} [quantityDelivered]
 */

/**
 * @typedef {Object} PaymentHistoryEntry
 * @property {number} id
 * @property {string} date
 * @property {number} amount
 * @property {string} method
 * @property {string} cashier
 * @property {string} reference
 */

/**
 * @typedef {Object} Sale
 * @property {number} id
 * @property {string} date
 * @property {SaleItem[]} items
 * @property {number} total
 * @property {string} paymentMethod
 * @property {string} cashier
 * @property {string} invoiceNumber
 * @property {number} storeId
 * @property {'pending'|'partially_delivered'|'delivered'} deliveryStatus
 * @property {'completed'|'cancelled'} [status]
 * @property {string} [customerName]
 * @property {string} [customerPhone]
 * @property {number} [customerId]
 * @property {number} [amountPaid]
 * @property {number} [amountDue]
 * @property {'fully_paid'|'partial'|'unpaid'} [paymentStatus]
 * @property {PaymentHistoryEntry[]} [paymentHistory]
 * @property {boolean} [deliveryUnlocked]
 * @property {'sale'|'return'|'deposit'|'refund'} [type]
 * @property {string} [originalInvoiceNumber]
 * @property {number} [itemsTotal]
 */

/**
 * @typedef {Object} Expense
 * @property {number} id
 * @property {string} date
 * @property {string} label
 * @property {number} amount
 * @property {string} cashier
 * @property {number} storeId
 */

/**
 * @typedef {Object} Versement
 * @property {number} id
 * @property {string} date
 * @property {number} amount
 * @property {string} cashier
 * @property {number} storeId
 */

/**
 * @typedef {Object} CashReport
 * @property {number} id
 * @property {string} date
 * @property {string} cashier
 * @property {number} storeId
 * @property {number} initialCashFund
 * @property {number} totalSales
 * @property {number} totalExpenses
 * @property {number} totalVersements
 * @property {number} finalBalance
 * @property {number} discrepancy
 * @property {string} notes
 */

export {};
