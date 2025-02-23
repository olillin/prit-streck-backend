export const CREATE_GROUP = 'INSERT INTO groups VALUES ($1)'
export const GET_GROUP = 'SELECT * FROM groups WHERE gammaId = $1 LIMIT 1'
export const GET_GROUPS = 'SELECT gammaId FROM groups'
export const GROUP_EXISTS = 'SELECT EXISTS(SELECT * FROM groups WHERE gammaId = $1)'

export const CREATE_USER = 'INSERT INTO users VALUES ($1, $2, 0)'
export const GET_USER = 'SELECT * FROM users WHERE gammaId = $1 LIMIT 1'
export const GET_USERS_IN_GROUP = 'SELECT * FROM users WHERE groupId = $1'
export const SET_BALANCE = 'UPDATE users SET balance = $2 WHERE gammaId = $1'
export const USER_EXISTS = 'SELECT EXISTS(SELECT * FROM users WHERE gammaId = $1)'

export const CREATE_ITEM = 'INSERT INTO items(groupid, displayname) VALUES ($1, $2)'
export const CREATE_ITEM_WITH_ICON = 'INSERT INTO items(groupid, displayname, iconurl) VALUES ($1, $2, $3)'
export const GET_ITEM = 'SELECT * FROM items WHERE id = $1 LIMIT 1'
export const GET_ITEMS_IN_GROUP = 'SELECT * FROM items WHERE groupId = $1'

export const CREATE_PRICE = 'INSERT INTO prices(itemid, price, displayname) VALUES ($1, $2, $3)'
export const GET_PRICES_FOR_ITEM = 'SELECT * FROM prices WHERE itemId = $1'

export const CREATE_PURCHASE = 'INSERT INTO purchases(groupid, purchasedby, purchasedfor) VALUES ($1, $2, $3)'
export const GET_PURCHASE = 'SELECT * FROM purchases WHERE id = $1'
export const GET_PURCHASES_IN_GROUP = 'SELECT * FROM purchases WHERE groupId = $1'
export const DELETE_PURCHASE = 'DELETE FROM purchases WHERE id = $1'

export const ADD_PURCHASED_ITEM = 'INSERT INTO purchaseditems(purchaseid, itemid, quantity, purchaseprice) VALUES ($1, $2, $3, $4)'
export const GET_PURCHASED_ITEMS = 'SELECT * FROM purchasedItems WHERE purchaseId = $1'
