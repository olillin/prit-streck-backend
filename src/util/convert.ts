import {
    Deposit,
    Group,
    JWT,
    LoginResponse,
    Purchase,
    PurchasedItem,
    Transaction,
    TransactionType,
    UserResponse,
} from '../types'
import * as tableType from '../database/types'
import * as gamma from 'gammait'
import { groupAvatarUrl, userAvatarUrl } from 'gammait/urls'
import { Item, User } from '../types'
import {FullItemWithPrices} from "../database/types";

export function splitFullItemWithPrices(
    fullItemWithPrices: tableType.FullItemWithPrices[]
): [tableType.FullItem, tableType.Prices[], boolean] {
    if (fullItemWithPrices.length === 0) {
        throw new Error('Item is empty')
    }

    const item: tableType.FullItem = {
        id: fullItemWithPrices[0].id,
        group_id: fullItemWithPrices[0].group_id,
        display_name: fullItemWithPrices[0].display_name,
        icon_url: fullItemWithPrices[0].icon_url,
        created_time: fullItemWithPrices[0].created_time,
        visible: fullItemWithPrices[0].visible,
        times_purchased: fullItemWithPrices[0].times_purchased,
    }
    const prices: tableType.Prices[] = fullItemWithPrices.map(fullItemWithPrice => ({
        item_id: fullItemWithPrice.id,
        price: fullItemWithPrice.price,
        display_name: fullItemWithPrice.price_display_name,
    }))
    const isFavorite = fullItemWithPrices[0].favorite

    return [item, prices, isFavorite]
}

export function toItem(
    item: tableType.FullItem,
    prices: tableType.Prices[],
    favorite: boolean
): Item
export function toItem(item: tableType.FullItemWithPrices[]): Item
export function toItem(
    a: tableType.FullItem | tableType.FullItemWithPrices[],
    b?: tableType.Prices[],
    c?: boolean
): Item {
    let fullItem: tableType.FullItem
    let prices: tableType.Prices[]
    let favorite: boolean
    if (b === undefined || c === undefined) {
        [fullItem, prices, favorite] = splitFullItemWithPrices(a as FullItemWithPrices[])
    } else {
        fullItem = a as tableType.FullItem
        prices = b
        favorite = c
    }

    return {
        id: fullItem.id,
        addedTime: fullItem.created_time.getTime(),
        displayName: fullItem.display_name,
        prices: prices.map(price => ({
            price: price.price,
            displayName: price.display_name,
        })),
        timesPurchased: fullItem.times_purchased,
        visible: fullItem.visible,
        favorite: favorite,
        ...(!!fullItem.icon_url && { icon: fullItem.icon_url }),
    }
}

type GammaUser = gamma.User | gamma.UserInfo
function isUserInfo(gammaUser: GammaUser): gammaUser is gamma.UserInfo {
    return 'sub' in gammaUser
}
export function toUser(
    dbUser: tableType.FullUser,
    gammaUser: gamma.User | gamma.UserInfo
): User {
    return {
        id: dbUser.id,
        balance: dbUser.balance,
        ...(isUserInfo(gammaUser)
            ? {
                gammaId: gammaUser.sub,
                nick: gammaUser.nickname,
                firstName: gammaUser.given_name,
                lastName: gammaUser.family_name,
                avatarUrl: userAvatarUrl(gammaUser.sub),
              }
            : {
                gammaId: gammaUser.id,
                nick: gammaUser.nick,
                firstName: gammaUser.firstName,
                lastName: gammaUser.lastName,
                avatarUrl: userAvatarUrl(gammaUser.id),
              }),
    }
}

export function toGroup(dbGroup: tableType.Groups, gammaGroup: gamma.Group | gamma.GroupWithPost): Group {
    return {
        id: dbGroup.id,
        gammaId: dbGroup.gamma_id,
        avatarUrl: groupAvatarUrl(dbGroup.gamma_id),
        prettyName: gammaGroup.prettyName,
    }
}

export function toUserResponse(
    dbUser: tableType.FullUser,
    gammaUser: GammaUser,
    gammaGroup: gamma.Group
): UserResponse {
    const dbGroup: tableType.Groups = {
        id: dbUser.group_id,
        gamma_id: dbUser.group_gamma_id,
    }
    return {
        user: toUser(dbUser, gammaUser),
        group: toGroup(dbGroup, gammaGroup),
    }
}

export function toLoginResponse(
    dbUser: tableType.FullUser,
    gammaUser: GammaUser,
    gammaGroup: gamma.Group,
    token: JWT
): LoginResponse {
    return {
        access_token: token.access_token,
        token_type: 'Bearer',
        expires_in: token.expires_in,
        ...toUserResponse(dbUser, gammaUser, gammaGroup),
    }
}

export function toTransaction<T extends TransactionType>(
    dbTransaction: tableType.Transactions,
    type: T
): Transaction<T> {
    return {
        type,
        id: dbTransaction.id,
        createdBy: dbTransaction.created_by,
        createdFor: dbTransaction.created_for,
        createdTime: dbTransaction.created_time.getTime(),
    }
}

export function toPurchasedItem(
    dbPurchasedItem: tableType.PurchasedItems | tableType.Purchases
): PurchasedItem {
    return {
        item: {
            displayName: dbPurchasedItem.display_name,
            ...(!!dbPurchasedItem.item_id && { id: dbPurchasedItem.item_id }),
            ...(!!dbPurchasedItem.icon_url && { icon: dbPurchasedItem.icon_url }),
        },
        quantity: dbPurchasedItem.quantity,
        purchasePrice: {
            price: dbPurchasedItem.purchase_price,
            displayName: dbPurchasedItem.purchase_price_name,
        },
    }
}

export function toPurchase(
    dbPurchase: tableType.Purchases[]
): Purchase {
    return {
        items: dbPurchase.map(toPurchasedItem),
        ...toTransaction(dbPurchase[0], 'purchase'),
    }
}

export function toDeposit(
    dbDeposit: tableType.Deposits
): Deposit {
    return {
        total: dbDeposit.total,
        ...toTransaction(dbDeposit, 'deposit'),
    }
}

export function fromFullTransaction(
    dbFullTransaction: tableType.FullTransaction[]
): Deposit | Purchase {
    // Determine transaction type
    const firstRow = dbFullTransaction[0]
    const depositTotal = firstRow.total
    const isDeposit = depositTotal !== null

    const isPurchase = firstRow.item_id !== null //
        && firstRow.display_name !== null //
        && firstRow.purchase_price !== null //
        && firstRow.purchase_price_name !== null //
        && firstRow.quantity !== null //

    if (isDeposit) {
        const dbDeposit: tableType.Deposits = {
            id: firstRow.id,
            group_id: firstRow.group_id,
            created_by: firstRow.created_by,
            created_for: firstRow.created_for,
            created_time: firstRow.created_time,
            total: depositTotal,
        }
        return toDeposit(dbDeposit)
    }
    if (isPurchase) {
        const dbPurchase: tableType.Purchases[] = dbFullTransaction.map<tableType.Purchases>(row => ({
            id: row.id,
            group_id: row.group_id,
            created_by: row.created_by,
            created_for: row.created_for,
            created_time: row.created_time,
            item_id: row.item_id,
            display_name: row.display_name!,
            icon_url: row.icon_url,
            purchase_price: row.purchase_price!,
            purchase_price_name: row.purchase_price_name!,
            quantity: row.quantity!,
        }))
        return toPurchase(dbPurchase)
    }
    throw new Error('Transaction is invalid, not deposit nor purchase')
}