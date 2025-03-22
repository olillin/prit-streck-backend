import { GroupId, UserId } from 'gammait'
import { QueryResultRow } from 'pg'

export interface TableNames extends QueryResultRow {
    table_name: string
}

export interface Users extends QueryResultRow {
    gamma_id: UserId
    group_id: GroupId
    balance: number
}

export interface Groups extends QueryResultRow {
    gamma_id: GroupId
}

export interface Items extends QueryResultRow {
    id: number
    group_id: GroupId
    display_name: string
    icon_url: string | null
    created_time: Date
    times_purchased: number
    visible: boolean
}

export interface Prices extends QueryResultRow {
    item_id: number
    price: number
    display_name: string
}

export interface Transactions extends QueryResultRow {
    id: number
    group_id: GroupId
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
    user_id: UserId
    item_id: number
}

export interface Exists extends QueryResultRow {
    exists: string
}

export interface Count extends QueryResultRow {
    count: string
}
