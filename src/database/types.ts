import { GroupId, UserId } from 'gammait'
import { QueryResultRow } from 'pg'

export interface TableNames extends QueryResultRow {
    table_name: string
}

export interface Users extends QueryResultRow {
    id: number
    gamma_id: UserId
    group_id: number
}

export interface Groups extends QueryResultRow {
    id: number
    gamma_id: GroupId
}

export interface Items extends QueryResultRow {
    id: number
    group_id: number
    display_name: string
    icon_url: string | null
    created_time: Date
    visible: boolean
}

export interface FullItem extends Items {
    times_purchased: number
}

export interface Prices extends QueryResultRow {
    item_id: number
    price: number
    display_name: string
}

export interface Transactions extends QueryResultRow {
    id: number
    group_id: number
    created_by: UserId
    created_for: UserId
    created_time: Date
}

export interface PurchasedItems extends QueryResultRow {
    purchase_id: number

    quantity: number
    purchase_price: number
    purchase_price_display_name: string

    item_id: number | null
    display_name: string
    icon_url: string | null
}

export interface Deposits extends Transactions {
    total: number
}

export interface FavoriteItems extends QueryResultRow {
    user_id: number
    item_id: number
}

// Views
export interface Purchases extends QueryResultRow {
    id: number
    group_id: number
    created_by: number
    created_for: number
    created_time: Date
    item_id: number
    display_name: number
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

export interface FullItemWithPrices extends FullItem {
    favorite: boolean

    price: number
    price_display_name: string
}