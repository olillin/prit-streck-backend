import { GroupId, UserId } from 'gammait'
import { QueryResultRow } from 'pg'

export interface Users extends QueryResultRow {
    gammaid: UserId
    groupid: GroupId
    balance: number
}

export interface Groups extends QueryResultRow {
    gammaid: GroupId
}

export interface Items extends QueryResultRow {
    id: number
    groupid: GroupId
    displayname: string
    iconurl?: string
    addedtime: Date
    timespurchased: number
    visible: boolean
}

export interface Prices extends QueryResultRow {
    itemid: number
    price: number
    displayname: string
}

export interface Transactions extends QueryResultRow {
    id: number
    groupid: GroupId
    createdby: UserId
    createdfor: UserId
    createdtime: Date
}

export interface PurchasedItems extends QueryResultRow {
    purchaseid: number
    itemid: number
    quantity: number
    purchaseprice: number
}

export interface Deposits extends QueryResultRow {
    transactionid: number
    total: number
}

export interface FavoriteItems extends QueryResultRow {
    userid: UserId
    itemid: number
}

export interface Exists extends QueryResultRow {
    exists: boolean
}
