import { GroupId, UserId } from 'gammait'

export interface TableNames {
    table_name: string
}

export interface Users {
    id: number
    gamma_id: UserId
    group_id: number
}

export interface Groups {
    id: number
    gamma_id: GroupId
}

export interface Items {
    id: number
    group_id: number
    display_name: string
    icon_url: string | null
    created_time: Date
    flags: number | null
}

export interface Prices {
    item_id: number
    price: number
    display_name: string
}

/** NOTE: This interface does not represent a table or view in the database */
export interface SharedTransactionProperties {
    id: number
    group_id: number
    created_by: number
    created_time: Date
    flags: number | null
    comment: string | null
}

export interface Transactions extends SharedTransactionProperties{
    type: 'purchase' | 'deposit' | 'stock_update'
}

export interface Purchases extends SharedTransactionProperties {
    created_for: number
}

export interface PurchasedItems {
    transaction_id: number

    item_id: number | null
    display_name: string
    icon_url: string | null

    purchase_price: number
    purchase_price_name: string
    quantity: number
}

export interface Deposits extends SharedTransactionProperties {
    created_for: number
    total: number
}

export type StockUpdates = SharedTransactionProperties

export interface ItemStockUpdates {
    transaction_id: number

    item_id: number
    before: number
    after: number
}

export interface FavoriteItems {
    user_id: number
    item_id: number
}

// Views
export interface FullPurchases extends Purchases {
    item_id: number | null
    display_name: string
    icon_url: string | null
    purchase_price: number
    purchase_price_name: string
    quantity: number
}

export interface FullStockUpdates extends StockUpdates {
    item_id: number
    before: number
    after: number
}

export interface UsersTotalDeposited extends Users {
    total: number
}

export interface UserTotalPurchased extends Users {
    total: number
}

export interface UserBalances extends Users {
    balance: number
}

export interface FullUser extends UserBalances {
    group_gamma_id: GroupId
}

export interface FullItem extends Items {
    times_purchased: number
    stock: number
}

export interface FullItemWithPrices extends FullItem {
    favorite: boolean

    price: number
    price_display_name: string
}
