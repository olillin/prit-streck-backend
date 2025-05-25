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
    visible: boolean
}

export interface Prices {
    item_id: number
    price: number
    display_name: string
}

export interface Transactions {
    id: number
    group_id: number
    created_by: UserId
    created_time: Date
    comment: string | null
}

export interface Purchases extends Transactions {
    created_for: UserId
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

export interface Deposits extends Transactions {
    created_for: UserId
    total: number
}

export interface StockUpdates extends Transactions {}

export interface ItemStockUpdates {
    transaction_id: number

    item_id: number
    quantity: number
    absolute: boolean
}

export interface FavoriteItems {
    user_id: number
    item_id: number
}

// Views
export interface FullPurchases extends Transactions {
    item_id: number | null
    display_name: string
    icon_url: string | null
    purchase_price: number
    purchase_price_name: string
    quantity: number
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

export interface FullTransaction extends Transactions {
    total: number | null

    item_id: number | null
    display_name: string | null
    icon_url: string | null
    purchase_price: number | null
    purchase_price_name: string | null
    quantity: number | null
}
