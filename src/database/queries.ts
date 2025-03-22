// Database transactions

// GLOBAL OPERATIONS:
// Related to the 'groups' table
// Check if user exists in any group
//
// LOCAL (GROUP) OPERATIONS:
// Everything else

// Create group
// Delete group
// Get group with members
// Get groups
// Check group exists

// Create user
// Update user gamma id
// Delete user
// Get user with group
// Check user exists in group
// Check user exists in any group

// Create item with prices
// Create item with prices and icon
// Update item (dynamic transaction)
// Add favorite item
// Remove favorite item
// Get item in group with prices
// Get items in group with prices
// Check item exists in group
// Check display name exists in group
// Delete item

// Remove prices for item
// Add prices to item (dynamic transaction)

// Get purchase by id in group
// Create purchase with purchased items (dynamic transaction)
// Create deposit
// Get transactions in group with

export const GET_TABLES = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"

export const CREATE_GROUP = 'INSERT INTO groups VALUES ($1) RETURNING *'
export const GET_GROUP = 'SELECT * FROM groups WHERE gammaId = $1 LIMIT 1'
export const GET_GROUPS = 'SELECT gammaId FROM groups'
export const GROUP_EXISTS = 'SELECT EXISTS(SELECT * FROM groups WHERE gammaId = $1)'

export const CREATE_USER = 'INSERT INTO users(gammaId, groupId) VALUES ($1, $2) RETURNING *'
export const GET_USER = 'SELECT * FROM users WHERE gammaId = $1 LIMIT 1'
export const GET_USERS_IN_GROUP = 'SELECT * FROM users WHERE groupId = $1'
export const SET_BALANCE = 'UPDATE users SET balance = $2 WHERE gammaId = $1 RETURNING *'
export const USER_EXISTS = 'SELECT EXISTS(SELECT * FROM users WHERE gammaId = $1)'

export const CREATE_ITEM = 'INSERT INTO items(groupId, displayName) VALUES ($1, $2) RETURNING *'
export const CREATE_ITEM_WITH_ICON = 'INSERT INTO items(groupId, displayName, iconurl) VALUES ($1, $2, $3) RETURNING *'
export const GET_ITEM = 'SELECT * FROM items WHERE Id = $1 LIMIT 1'
export const GET_ITEMS_IN_GROUP = 'SELECT * FROM items WHERE groupId = $1'
export const UPDATE_ITEM = (columnName: string) => `UPDATE items SET ${columnName} = $2 WHERE id = $1 RETURNING *`
export const ITEM_EXISTS = 'SELECT EXISTS(SELECT * FROM items WHERE id = $1)'
export const ITEM_EXISTS_IN_GROUP = 'SELECT EXISTS(SELECT * FROM items WHERE id = $1 AND groupId = $2)'
export const ITEM_NAME_EXISTS_IN_GROUP = 'SELECT EXISTS(SELECT * FROM items WHERE displayName = $1 AND groupId = $2)'
export const DELETE_ITEM = 'DELETE FROM items WHERE id = $1'

export const CREATE_PRICE = 'INSERT INTO prices(itemId, price, displayName) VALUES ($1, $2, $3) RETURNING *'
export const GET_PRICES_FOR_ITEM = 'SELECT * FROM prices WHERE itemId = $1 ORDER BY price ASC'
export const REMOVE_PRICES_FOR_ITEM = 'DELETE FROM prices WHERE itemId = $1'

export const CREATE_TRANSACTION = 'INSERT INTO transactions(groupId, createdBy, createdFor) VALUES ($1, $2, $3) RETURNING *'
export const GET_TRANSACTION = 'SELECT * FROM transactions WHERE Id = $1'
export const TRANSACTION_EXISTS_IN_GROUP = 'SELECT EXISTS(SELECT * FROM transactions WHERE id = $1 AND groupId = $2)'
export const COUNT_TRANSACTIONS_IN_GROUP = 'SELECT COUNT(*) FROM transactions WHERE groupId = $1'
export const GET_TRANSACTIONS_IN_GROUP = 'SELECT * FROM transactions WHERE groupId = $1 ORDER BY createdTime DESC'
export const DELETE_TRANSACTION = 'DELETE FROM transactions WHERE Id = $1'

export const CREATE_DEPOSIT = 'INSERT INTO deposits(transactionId, total) VALUES ($1, $2) RETURNING *'
export const GET_DEPOSIT = 'SELECT * FROM deposits WHERE transactionId = $1'
export const DELETE_DEPOSIT = 'DELETE FROM deposits WHERE transactionId = $1'

export const ADD_PURCHASED_ITEM = 'INSERT INTO purchaseditems(transactionId, quantity, purchasePrice, purchasePriceName, itemId, displayName) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *'
export const ADD_PURCHASED_ITEM_WITH_ICON = 'INSERT INTO purchaseditems(transactionId, quantity, purchasePrice, purchasePriceName, itemId, displayName, iconUrl) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *'
export const GET_PURCHASED_ITEMS = 'SELECT * FROM purchasedItems WHERE transactionId = $1'
export const HAS_BEEN_PURCHASED = 'SELECT EXISTS(SELECT * FROM purchasedItems WHERE itemId = $1)'

export const ADD_FAVORITE_ITEM = 'INSERT INTO favoriteItems(userId, itemId) VALUES($1, $2)'
export const REMOVE_FAVORITE_ITEM = 'DELETE FROM favoriteItems WHERE userId = $1 AND itemId = $2'
export const GET_FAVORITE_ITEM = 'SELECT * FROM favoriteItems WHERE userId = $1 AND itemId = $2'
export const FAVORITE_ITEM_EXISTS = 'SELECT EXISTS(SELECT * FROM favoriteItems WHERE userId = $1 AND itemId = $2)'
