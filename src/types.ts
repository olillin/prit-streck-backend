import { GroupId, UserId } from 'gammait'
import { JwtPayload } from 'jsonwebtoken'
import { itemSortModes } from './middleware/validators'

// #region Basic types
export interface Group {
    id: GroupId

    prettyName: string
    avatarUrl: string
}

export interface User {
    id: UserId

    firstName: string
    lastName: string
    nick: string
    avatarUrl: string

    balance: number
}

export interface Item {
    id: number
    addedTime: number
    icon?: string
    displayName: string
    prices: Price[]
    timesPurchased: number
    visible: boolean
    favorite: boolean
}

export interface Price {
    price: number
    displayName: string
}

export type TransactionType = 'purchase' | 'deposit'
export interface Transaction<T extends TransactionType> {
    type: T
    id: number

    createdBy: UserId
    createdFor: UserId
    createdTime: number
}

export interface Purchase extends Transaction<'purchase'> {
    items: PurchasedItem[]
}

export interface PurchasedItem {
    id: number
    quantity: number
    purchasePrice: number
}

export interface Deposit extends Transaction<'deposit'> {
    total: number
}
// #endregion Basic types

// #region Response types
export type ResponseBody<T> = [T] extends [never]
    ? { error: ResponseError } //
    : { data: T }

export interface ResponseError {
    code: number
    message: string
}

export interface UserResponse {
    user: User
    group: Group
}

export interface GroupResponse {
    group: Group
    members: User[]
}

export interface JWT {
    token: string
    expireMinutes: number
}

export interface LocalJwt extends JwtPayload {
    userId: UserId
    groupId: GroupId
}

export interface LoginResponse extends UserResponse {
    token: JWT
}

export interface ItemsResponse {
    items: Item[]
}

export interface ItemResponse {
    item: Item
}

export interface TransactionResponse {
    transaction: Transaction<any>
}

export interface PaginatedResponse {
    next?: string
    previous?: string
}

export interface TransactionsResponse extends PaginatedResponse {
    transactions: Transaction<any>[]
}
// #endregion Response types

// #region Request types
export interface PostPurchaseBody {
    userId: UserId
    items: Array<PurchasedItem>
}

export interface PostDepositBody {
    userId: UserId
    total: number
}

export interface PostItemBody {
    displayName: string
    prices: Price[]
    icon?: string
}

export interface PatchItemBody {
    icon?: string
    displayName?: string
    prices?: Price[]
    visible?: boolean
    favorite?: boolean
}
// #endregion Request types

export type ItemSortMode = (typeof itemSortModes)[number]
