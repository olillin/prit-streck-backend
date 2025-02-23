import { GroupId, UserId } from 'gammait'
import { JwtPayload } from 'jsonwebtoken'

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
}

export interface Price {
    price: number
    displayName?: string
}

export interface Purchase {
    id: number
    purchasedBy: UserId
    purchasedFor: UserId
    purchasedDate: number
    items: PurchasedItem[]
}

export interface PurchasedItem {
    id: number
    quantity: number
    purchasePrice: number
}
// #endregion Basic types

// #region Response types
export interface ResponseBody {
    data?: ResponseData
    error?: ResponseError
}

export interface ResponseData {}

export interface ResponseError {
    code: number
    message: string
}

export interface UserResponse extends User, ResponseData {
    group: Group
}

export interface GroupResponse extends Group, ResponseData {
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

export interface LoginResponse {
    token: JWT
    user: UserResponse
}

export interface ItemsResponse {
    items: Item[]
}

export interface ItemResponse {
    item: Item
}
// #endregion Response types
