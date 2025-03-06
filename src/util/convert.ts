import { Deposit, Group, JWT, LoginResponse, Purchase, PurchasedItem, Transaction, TransactionType, UserResponse } from '../types'
import * as tableType from '../database/types'
import * as gamma from 'gammait'
import { groupAvatarUrl, userAvatarUrl } from 'gammait/urls'
import { UserId } from 'gammait'
import { database } from '../config/clients'
import { Item, User } from '../types'

export function toItem(item: tableType.Items, prices: tableType.Prices[], favorite: boolean): Item {
    return {
        id: item.id,
        addedTime: item.addedtime.getTime(),
        displayName: item.displayname,
        prices: prices.map(price => ({
            price: price.price,
            displayName: price.displayname,
        })),
        timesPurchased: item.timespurchased,
        visible: item.visible,
        favorite: favorite,
        ...(!!item.iconurl && { icon: item.iconurl }),
    }
}

type GammaUser = gamma.User | gamma.UserInfo
function isUserInfo(gammaUser: GammaUser): gammaUser is gamma.UserInfo {
    return gammaUser.hasOwnProperty('sub')
}
export function toUser(dbUser: tableType.Users, gammaUser: gamma.User | gamma.UserInfo): User {
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

export function toUserResponse(dbUser: tableType.Users, gammaUser: GammaUser, gammaGroup: gamma.Group): UserResponse {
    return {
        user: toUser(dbUser, gammaUser),
        group: toGroup(gammaGroup),
    }
}

export function toLoginResponse(dbUser: tableType.Users, gammaUser: GammaUser, gammaGroup: gamma.Group, token: JWT): LoginResponse {
    return { token, ...toUserResponse(dbUser, gammaUser, gammaGroup) }
}

export function toTransaction<T extends TransactionType>(dbTransaction: tableType.Transactions, type: T): Transaction<T> {
    return {
        type,
        id: dbTransaction.id,
        createdBy: dbTransaction.createdby,
        createdFor: dbTransaction.createdfor,
        createdTime: dbTransaction.createdtime.getTime(),
    }
}

export function toPurchasedItem(dbPurchasedItem: tableType.PurchasedItems): PurchasedItem {
    return {
        item: {
            id: dbPurchasedItem.itemid,
            displayName: dbPurchasedItem.displayname,
            ...(!!dbPurchasedItem.iconurl && { icon: dbPurchasedItem.iconurl }),
        },
        quantity: dbPurchasedItem.quantity,
        purchasePrice: {
            price: dbPurchasedItem.purchaseprice,
            displayName: dbPurchasedItem.purchasepricename,
        },
    }
}

export function toPurchase(dbTransaction: tableType.Transactions, dbPurchasedItems: tableType.PurchasedItems[]): Purchase {
    return {
        items: dbPurchasedItems.map(toPurchasedItem),
        ...toTransaction(dbTransaction, 'purchase'),
    }
}

export function toDeposit(dbTransaction: tableType.Transactions, dbDeposit: tableType.Deposits): Deposit {
    return {
        total: dbDeposit.total,
        ...toTransaction(dbTransaction, 'deposit'),
    }
}
