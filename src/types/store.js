/**
 * @typedef {Object} Store
 * @property {number} id
 * @property {string} name
 * @property {string} location
 */

/**
 * @typedef {Object} TransferItem
 * @property {number} productId
 * @property {string} name
 * @property {number} quantity
 */

/**
 * @typedef {Object} Transfer
 * @property {number} id
 * @property {string} reference
 * @property {string} date
 * @property {number} fromStoreId
 * @property {number} toStoreId
 * @property {'in_transit'|'completed'} status
 * @property {TransferItem[]} items
 * @property {string} initiatedBy
 * @property {string|null} [receivedBy]
 * @property {string|null} [receivedDate]
 * @property {string} [notes]
 */

/**
 * @typedef {Object} StockEntryItem
 * @property {number} productId
 * @property {string} name
 * @property {number} quantity
 * @property {number} cost
 */

/**
 * @typedef {Object} StockEntry
 * @property {number} id
 * @property {string} date
 * @property {string} supplier
 * @property {string} noteNumber
 * @property {StockEntryItem[]} items
 * @property {number} storeId
 */

export {};
