/**
 * @typedef {Object} Customer
 * @property {number} id
 * @property {string} name
 * @property {string} phone
 * @property {number} balance
 * @property {number} totalSpent
 */

/**
 * @typedef {Object} CustomerTransaction
 * @property {number} id
 * @property {number} customerId
 * @property {'deposit'|'refund'|'sale'} type
 * @property {number} amount
 * @property {string} [method]
 * @property {string} date
 * @property {string} reference
 * @property {string} [cashier]
 * @property {number} [storeId]
 */

export {};
