import { GroupId, UserId } from 'gammait'

export interface Users {
    gammaid: UserId
    groupid: GroupId
    balance: number
}

export interface Groups {
    gammaid: GroupId
}

export interface Items {
    id: number
    groupid: GroupId
    displayname: string
    iconurl?: string
    addedtime: Date
    timespurchased: number
    visible: boolean
}

export interface Prices {
    itemid: number
    price: number
    displayname?: string
}

export interface Purchases {
    id: number
    groupid: GroupId
    purchasedby: UserId
    purchasedfor: UserId
    purchaseddate: Date
}

export interface PurchasedItems {
    purchaseid: number
    itemid: number
    quantity: number
    purchaseprice: number
}
