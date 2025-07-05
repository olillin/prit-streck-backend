export const GET_TABLES = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"

export const SOFT_CREATE_GROUP_AND_USER = [
    `WITH group_row AS (
        INSERT INTO groups (gamma_id)
        VALUES ($1)
        ON CONFLICT DO NOTHING
        RETURNING id
    )
    INSERT INTO users(gamma_id, group_id)
    VALUES (
        $2,
        COALESCE(
            (SELECT id FROM group_row),
            (SELECT id FROM groups WHERE gamma_id = $1 LIMIT 1)
        )
    )
    ON CONFLICT DO NOTHING;`,
    'SELECT * FROM full_user WHERE group_gamma_id = $1 AND gamma_id = $2;'
]

export const CREATE_GROUP = 'INSERT INTO groups(gamma_id) VALUES ($1) RETURNING *;'
export const GET_GROUP = 'SELECT * FROM groups WHERE id = $1 LIMIT 1;'
export const GET_GROUPS = 'SELECT id FROM groups;'
export const GROUP_EXISTS = 'SELECT EXISTS(SELECT * FROM groups WHERE id = $1);'
export const GAMMA_GROUP_EXISTS = 'SELECT EXISTS(SELECT * FROM groups WHERE gamma_id = $1);'

export const CREATE_USER = 'INSERT INTO users(gamma_id, group_id) VALUES ($1, $2) RETURNING *;'
export const GET_USER = 'SELECT * FROM users WHERE id = $1;'
export const GET_FULL_USER = 'SELECT * FROM full_user WHERE id = $1;'
export const GET_USERS_IN_GROUP = 'SELECT * FROM users WHERE group_id = $1;'
export const GET_FULL_USERS_IN_GROUP = 'SELECT * FROM full_user WHERE group_id = $1;'
export const USER_EXISTS_IN_GROUP = 'SELECT EXISTS(SELECT * FROM users WHERE id = $1 AND group_id = $2);'
export const GAMMA_USER_EXISTS = 'SELECT EXISTS(SELECT * FROM users WHERE gamma_id = $1);'
export const GAMMA_USER_EXISTS_IN_GROUP = 'SELECT EXISTS(SELECT * FROM users WHERE gamma_id = $1 AND group_id = $2);'

export const CREATE_BARE_ITEM = 'INSERT INTO items(group_id, display_name) VALUES ($1, $2) RETURNING *;'
export const CREATE_BARE_ITEM_WITH_ICON = 'INSERT INTO items(group_id, display_name, icon_url) VALUES ($1, $2, $3) RETURNING *;'
export const GET_ITEM = 'SELECT * FROM items WHERE id = $1;'
export const GET_FULL_ITEM = 'SELECT * FROM full_item WHERE id = $1;'
export const GET_ITEMS_IN_GROUP = 'SELECT * FROM items WHERE group_id = $1;'
export const GET_ITEM_FLAGS = "SELECT COALESCE(flags, '0'::varbit) FROM items WHERE id = $1;"
export const SET_ITEM_FLAG = "UPDATE items SET flags = SET_BIT(COALESCE(flags, '0'::varbit), $2, $3) WHERE id = $1;"
export const UPDATE_ITEM = (columnName: string) => `UPDATE items SET ${columnName} = $2 WHERE id = $1 RETURNING *;`
export const ITEM_EXISTS = 'SELECT EXISTS(SELECT * FROM items WHERE id = $1);'
export const ITEM_EXISTS_IN_GROUP = 'SELECT EXISTS(SELECT * FROM items WHERE id = $1 AND group_id = $2);'
export const ITEM_NAME_EXISTS_IN_GROUP = 'SELECT EXISTS(SELECT * FROM items WHERE display_name = $1 AND group_id = $2);'
export const IS_ITEM_VISIBLE = "SELECT GET_BIT(COALESCE(flags, '0'::varbit), 0) = 0 AS visible FROM items WHERE id = $1;"
export const DELETE_ITEM = 'DELETE FROM items WHERE id = $1;'
export const GET_FULL_ITEM_WITH_PRICES = `SELECT 
    i.id,
    i.group_id,
    i.display_name,
    i.icon_url,
    i.created_time,
    i.flags,
    i.stock,
    i.times_purchased,
    EXISTS(SELECT * FROM favorite_items WHERE item_id = $1 AND user_id = $2) AS favorite,
    p.price,
    p.display_name AS price_display_name
  FROM full_item i LEFT JOIN prices p ON p.item_id = i.id WHERE i.id = $1`
export const GET_FULL_ITEMS_WITH_PRICES_IN_GROUP = `SELECT 
    i.id,
    i.group_id,
    i.display_name,
    i.icon_url,
    i.created_time,
    i.flags,
    i.stock,
    i.times_purchased,
    EXISTS(SELECT * FROM favorite_items WHERE item_id = i.id AND user_id = $2) AS favorite,
    p.price,
    p.display_name AS price_display_name
  FROM full_item i LEFT JOIN prices p ON p.item_id = i.id WHERE i.group_id = $1`

export const CREATE_PRICE = 'INSERT INTO prices(item_id, price, display_name) VALUES ($1, $2, $3) RETURNING *;'
export const GET_PRICES_FOR_ITEM = 'SELECT * FROM prices WHERE item_id = $1 ORDER BY price;'
export const REMOVE_PRICES_FOR_ITEM = 'DELETE FROM prices WHERE item_id = $1;'

export const CREATE_PURCHASE = 'INSERT INTO purchases(group_id, created_by, created_for) VALUES ($1, $2, $3) RETURNING *;'
export const CREATE_PURCHASE_WITH_COMMENT = 'INSERT INTO purchases(group_id, created_by, created_for, comment) VALUES ($1, $2, $3, $4) RETURNING *;'
export const ADD_PURCHASED_ITEM = 'INSERT INTO purchased_items(transaction_id, quantity, purchase_price, purchase_price_name, item_id, display_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;'
export const ADD_PURCHASED_ITEM_WITH_ICON = 'INSERT INTO purchased_items(transaction_id, quantity, purchase_price, purchase_price_name, item_id, display_name, icon_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;'
export const GET_FULL_PURCHASE = 'SELECT * FROM full_purchases WHERE id = $1;'

export const CREATE_DEPOSIT = 'INSERT INTO deposits(group_id, created_by, created_for, total) VALUES ($1, $2, $3, $4) RETURNING *;'
export const CREATE_DEPOSIT_WITH_COMMENT = 'INSERT INTO deposits(group_id, created_by, created_for, comment, total) VALUES ($1, $2, $3, $4, $5) RETURNING *;'
export const GET_DEPOSIT = 'SELECT * FROM deposits WHERE id = $1;'

export const CREATE_STOCK_UPDATE = 'INSERT INTO stock_updates(group_id, created_by) VALUES ($1, $2) RETURNING *;'
export const CREATE_STOCK_UPDATE_WITH_COMMENT = 'INSERT INTO stock_updates(group_id, created_by, comment) VALUES ($1, $2, $3) RETURNING *;'
export const ADD_ITEM_STOCK_UPDATE = 'INSERT INTO item_stock_updates(transaction_id, item_id, before, after) VALUES ($1, $2, 0, $3) RETURNING *;'
export const GET_FULL_STOCK_UPDATE = 'SELECT * FROM full_stock_updates WHERE id = $1;'

export const GET_TRANSACTION = 'SELECT * FROM transactions WHERE id = $1;'
export const TRANSACTION_EXISTS_IN_GROUP = 'SELECT EXISTS(SELECT id FROM transactions WHERE id = $1 AND group_id = $2);'
export const COUNT_TRANSACTIONS_IN_GROUP = 'SELECT COUNT(id) FROM transactions WHERE group_id = $1;'
export const GET_ALL_TRANSACTIONS_IN_GROUP = 'SELECT * FROM transactions WHERE group_id = $1;'
export const GET_TRANSACTIONS_IN_GROUP = `SELECT *
        FROM transactions
        WHERE group_id = $1
        ORDER BY created_time DESC
        LIMIT $2
        OFFSET $3`
export const GET_TRANSACTION_IDS_IN_GROUP = `SELECT id
        FROM transactions
        WHERE group_id = $1
        ORDER BY created_time DESC
        LIMIT $2
        OFFSET $3`
export const GET_TRANSACTION_FLAGS = "SELECT COALESCE(flags, '0'::varbit) FROM transactions WHERE id = $1;"
export const SET_TRANSACTION_FLAG = "UPDATE transactions SET flags = SET_BIT(COALESCE(flags, '0'::varbit), $2, $3) WHERE id = $1;"

export const GET_FAVORITE_ITEM = 'SELECT * FROM favorite_items WHERE user_id = $1 AND item_id = $2;'
export const ADD_FAVORITE_ITEM = [
    'INSERT INTO favorite_items(user_id, item_id) VALUES($1, $2) ON CONFLICT DO NOTHING;',
    GET_FAVORITE_ITEM,
]
export const REMOVE_FAVORITE_ITEM = 'DELETE FROM favorite_items WHERE user_id = $1 AND item_id = $2;'
export const FAVORITE_ITEM_EXISTS = 'SELECT EXISTS(SELECT * FROM favorite_items WHERE user_id = $1 AND item_id = $2);'
