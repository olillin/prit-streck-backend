import { GroupId, UserId } from 'gammait'
import { JwtPayload } from 'jsonwebtoken'
import { itemSortModes } from './middleware/validators'
import { ApiError } from './errors'

// #region Basic types
export interface Group {
    id: number
    gammaId: GroupId

    prettyName: string
    avatarUrl: string
}

export interface User {
    id: number
    gammaId: UserId

    firstName: string
    lastName: string
    nick: string
    avatarUrl: string

    balance: number
}

export interface Item {
    id: number
    createdTime: number
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
    item: {
        id?: number
        displayName: string
        icon?: string
    }
    quantity: number
    purchasePrice: Price
}

export interface Deposit extends Transaction<'deposit'> {
    total: number
}
// #endregion Basic types

// #region Response types
export type ResponseBody<T> = [T] extends [never]
    ? { error: ResponseError }
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
    access_token: string
    expires_in: number
}

export interface LoggedInUser {
    userId: number
    groupId: number
    gammaUserId: UserId
    gammaGroupId: GroupId
}

export interface LocalJwt extends JwtPayload, LoggedInUser {}

export interface LoginResponse extends UserResponse, JWT {
    token_type: string
}

export interface ItemsResponse {
    items: Item[]
}

export interface ItemResponse {
    item: Item
}

export interface TransactionResponse {
    transaction: Transaction<TransactionType>
}

export interface CreatedTransactionResponse extends TransactionResponse {
    balance: number
}

export interface PaginatedResponse {
    next?: string
    previous?: string
}

export interface TransactionsResponse extends PaginatedResponse {
    transactions: Transaction<TransactionType>[]
}
// #endregion Response types

// #region Request types
export interface PostPurchaseBody {
    userId: number
    items: PurchaseItem[]
}

export interface PurchaseItem {
    id: number
    quantity: number
    purchasePrice: Price
}

export interface PostDepositBody {
    userId: number
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

export interface ErrorDefinition {
    code: number
    message: string
}
export type ErrorResolvable = ErrorDefinition | ApiError
