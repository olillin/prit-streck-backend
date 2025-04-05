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
): Item {
    return {
        id: item.id,
        addedTime: item.created_time.getTime(),
        displayName: item.display_name,
        prices: prices.map(price => ({
            price: price.price,
            displayName: price.display_name,
        })),
        timesPurchased: item.times_purchased,
        visible: item.visible,
        favorite: favorite,
        ...(!!item.icon_url && { icon: item.icon_url }),
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
        balance: dbUser.balance,
        ...(isUserInfo(gammaUser)
            ? {
                  id: gammaUser.sub,
                  nick: gammaUser.nickname,
                  firstName: gammaUser.given_name,
                  lastName: gammaUser.family_name,
                  avatarUrl: userAvatarUrl(gammaUser.sub),
              }
            : {
                  id: gammaUser.id,
                  nick: gammaUser.nick,
                  firstName: gammaUser.firstName,
                  lastName: gammaUser.lastName,
                  avatarUrl: userAvatarUrl(gammaUser.id),
              }),
    }
}

export function toGroup(gammaGroup: gamma.Group | gamma.GroupWithPost): Group {
    return {
        id: gammaGroup.id,
        avatarUrl: groupAvatarUrl(gammaGroup.id),
        prettyName: gammaGroup.prettyName,
    }
}

export function toUserResponse(
    dbUser: tableType.FullUser,
    gammaUser: GammaUser,
    gammaGroup: gamma.Group
): UserResponse {
    return {
        user: toUser(dbUser, gammaUser),
        group: toGroup(gammaGroup),
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
        createdBy: dbTransaction.createdby,
        createdFor: dbTransaction.createdfor,
        createdTime: dbTransaction.createdtime.getTime(),
    }
}

export function toPurchasedItem(
    dbPurchasedItem: tableType.PurchasedItems
): PurchasedItem {
    return {
        item: {
            displayName: dbPurchasedItem.displayname,
            ...(!!dbPurchasedItem.itemid && { id: dbPurchasedItem.itemid }),
            ...(!!dbPurchasedItem.iconurl && { icon: dbPurchasedItem.iconurl }),
        },
        quantity: dbPurchasedItem.quantity,
        purchasePrice: {
            price: dbPurchasedItem.purchaseprice,
            displayName: dbPurchasedItem.purchasepricename,
        },
    }
}

export function toPurchase(
    dbTransaction: tableType.Transactions,
    dbPurchasedItems: tableType.PurchasedItems[]
): Purchase {
    return {
        items: dbPurchasedItems.map(toPurchasedItem),
        ...toTransaction(dbTransaction, 'purchase'),
    }
}

export function toDeposit(
    dbTransaction: tableType.Transactions,
    dbDeposit: tableType.Deposits
): Deposit {
    return {
        total: dbDeposit.total,
        ...toTransaction(dbTransaction, 'deposit'),
    }
}
