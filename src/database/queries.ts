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
export const GET_GROUP = 'SELECT * FROM groups WHERE gamma_id = $1 LIMIT 1'
export const GET_GROUPS = 'SELECT gamma_id FROM groups'
export const GROUP_EXISTS = 'SELECT EXISTS(SELECT * FROM groups WHERE gamma_id = $1)'

export const CREATE_USER = 'INSERT INTO users(gamma_id, group_id) VALUES ($1, $2) RETURNING *'
export const GET_USER = 'SELECT * FROM users WHERE gamma_id = $1 LIMIT 1'
export const GET_USERS_IN_GROUP = 'SELECT * FROM users WHERE group_id = $1'
export const SET_BALANCE = 'UPDATE users SET balance = $2 WHERE gamma_id = $1 RETURNING *'
export const USER_EXISTS = 'SELECT EXISTS(SELECT * FROM users WHERE gamma_id = $1)'

export const CREATE_ITEM = 'INSERT INTO items(group_id, display_name) VALUES ($1, $2) RETURNING *'
export const CREATE_ITEM_WITH_ICON = 'INSERT INTO items(group_id, display_name, icon_url) VALUES ($1, $2, $3) RETURNING *'
export const GET_ITEM = 'SELECT * FROM items WHERE id = $1 LIMIT 1'
export const GET_ITEMS_IN_GROUP = 'SELECT * FROM items WHERE group_id = $1'
export const UPDATE_ITEM = (columnName: string) => `UPDATE items SET ${columnName} = $2 WHERE id = $1 RETURNING *`
export const ITEM_EXISTS = 'SELECT EXISTS(SELECT * FROM items WHERE id = $1)'
export const ITEM_EXISTS_IN_GROUP = 'SELECT EXISTS(SELECT * FROM items WHERE id = $1 AND group_id = $2)'
export const ITEM_NAME_EXISTS_IN_GROUP = 'SELECT EXISTS(SELECT * FROM items WHERE display_name = $1 AND group_id = $2)'
export const DELETE_ITEM = 'DELETE FROM items WHERE id = $1'

export const CREATE_PRICE = 'INSERT INTO prices(item_id, price, display_name) VALUES ($1, $2, $3) RETURNING *'
export const GET_PRICES_FOR_ITEM = 'SELECT * FROM prices WHERE item_id = $1 ORDER BY price ASC'
export const REMOVE_PRICES_FOR_ITEM = 'DELETE FROM prices WHERE item_id = $1'

export const CREATE_TRANSACTION = 'INSERT INTO transactions(group_id, created_by, created_for) VALUES ($1, $2, $3) RETURNING *'
export const GET_TRANSACTION = 'SELECT * FROM transactions WHERE id = $1'
export const TRANSACTION_EXISTS_IN_GROUP = 'SELECT EXISTS(SELECT * FROM transactions WHERE id = $1 AND group_id = $2)'
export const COUNT_TRANSACTIONS_IN_GROUP = 'SELECT COUNT(*) FROM transactions WHERE group_id = $1'
export const GET_TRANSACTIONS_IN_GROUP = 'SELECT * FROM transactions WHERE group_id = $1 ORDER BY created_time DESC'
export const DELETE_TRANSACTION = 'DELETE FROM transactions WHERE id = $1'

export const CREATE_DEPOSIT = 'INSERT INTO deposits(transaction_id, total) VALUES ($1, $2) RETURNING *'
export const GET_DEPOSIT = 'SELECT * FROM deposits WHERE transaction_id = $1'
export const DELETE_DEPOSIT = 'DELETE FROM deposits WHERE transaction_id = $1'

export const ADD_PURCHASED_ITEM = 'INSERT INTO purchased_items(transaction_id, quantity, purchase_price, purchase_price_name, item_id, display_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *'
export const ADD_PURCHASED_ITEM_WITH_ICON = 'INSERT INTO purchased_items(transaction_id, quantity, purchase_price, purchase_price_name, item_id, display_name, icon_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *'
export const GET_PURCHASED_ITEMS = 'SELECT * FROM purchased_items WHERE transaction_id = $1'
export const HAS_BEEN_PURCHASED = 'SELECT EXISTS(SELECT * FROM purchased_items WHERE item_id = $1)'

export const ADD_FAVORITE_ITEM = 'INSERT INTO favorite_items(user_id, item_id) VALUES($1, $2)'
export const REMOVE_FAVORITE_ITEM = 'DELETE FROM favorite_items WHERE user_id = $1 AND item_id = $2'
export const GET_FAVORITE_ITEM = 'SELECT * FROM favorite_items WHERE user_id = $1 AND item_id = $2'
export const FAVORITE_ITEM_EXISTS = 'SELECT EXISTS(SELECT * FROM favorite_items WHERE user_id = $1 AND item_id = $2)'
