/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} username
 * @property {string} name
 * @property {'manager'|'cashier'|'accountant'|'ceo'|'storekeeper'} role
 * @property {boolean} isActive
 * @property {number} [storeId]
 */

/**
 * @typedef {Object} LoginResponse
 * @property {User} user
 * @property {string} token
 */

export {};
