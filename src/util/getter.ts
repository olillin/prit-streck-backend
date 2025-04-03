import { GroupWithPost, UserId } from 'gammait'
import { database } from '../config/clients'
import { Deposit, Item, Purchase, Transaction, TransactionType } from '../types'
import { toDeposit, toItem, toPurchase } from './convert'
import environment from '../config/env'

// #region Database getters
export async function item(itemId: number, userId: number): Promise<Item> {
    const db = await database()
    const [item, prices, favorite] = await Promise.all([
        db.getItem(itemId),
        db.getPricesForItem(itemId),
        db.isFavorite(userId, itemId),
    ])

    if (!item) throw new Error('Item does not exist')

    return toItem(item, prices, favorite)
}

export async function purchase(purchaseId: number): Promise<Purchase> {
    const db = await database()
    const [transaction, purchasedItems] = await Promise.all([
        db.getTransaction(purchaseId),
        db.getPurchasedItems(purchaseId),
    ])

    if (!transaction) throw new Error('Purchase does not exist')

    return toPurchase(transaction, purchasedItems)
}

export async function deposit(depositId: number): Promise<Deposit> {
    const db = await database()
    const [transaction, deposit] = await Promise.all([
        db.getTransaction(depositId),
        db.getDeposit(depositId),
    ])

    if (!transaction) throw new Error('Deposit transaction does not exist')
    if (!deposit) throw new Error('Deposit does not exist')

    return toDeposit(transaction, deposit)
}

export async function transaction(
    transactionId: number
): Promise<Transaction<TransactionType>> {
    const functions = [purchase, transaction]

    for (const func of functions) {
        try {
            return await func(transactionId)
        } catch {
            continue
        }
    }
    throw new Error('Invalid transaction, is not purchase or deposit')
}
// #endregion Database getters

export function getAuthorizedGroup(
    groups: GroupWithPost[]
): GroupWithPost | undefined {
    return groups.find(
        group => group.superGroup.id === environment.SUPER_GROUP_ID
    )
}
