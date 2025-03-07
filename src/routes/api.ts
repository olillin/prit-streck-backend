import { Request, Response } from 'express'
import { GroupId, UserId } from 'gammait'
import { clientApi, database } from '../config/clients'
import * as tableType from '../database/types'
import { errors, sendError } from '../errors'
import { getGroupId, getUserId } from '../middleware/validateToken'
import { Deposit, GroupResponse, Item, ItemResponse, ItemSortMode, ItemsResponse, PatchItemBody, PostDepositBody, PostItemBody, PostPurchaseBody, Purchase, ResponseBody, Transaction, TransactionResponse, TransactionsResponse, User, UserResponse } from '../types'
import * as convert from '../util/convert'
import * as getter from '../util/getter'
import { getAuthorizedGroup } from '../util/getter'

export async function getUser(req: Request, res: Response) {
    const db = await database()

    const userId: UserId = getUserId(res)
    console.log(`Getting user info for: ${userId}`)

    // Get requests
    const dbUserPromise = db.getUser(userId).catch(reason => {
        if (!res.headersSent) {
            console.log(reason)
            sendError(res, 500, 'Failed to fetch user from database')
        }
    })
    const gammaUserPromise = clientApi.getUser(userId).catch(reason => {
        if (!res.headersSent) {
            console.log(reason)
            sendError(res, 404, 'User does not exist')
        }
    })
    const groupsPromise = clientApi.getGroupsFor(userId).catch(reason => {
        if (!res.headersSent) {
            console.log(reason)
            sendError(res, 500, 'Failed to fetch groups')
        }
    })

    // Await promises
    const dbUser = await dbUserPromise
    if (dbUser === undefined) {
        sendError(res, 404, 'User does not exist')
        return
    }
    const gammaUser = await gammaUserPromise
    if (!gammaUser) {
        sendError(res, 502, 'Failed to get user from gamma')
        return
    }
    const groups = await groupsPromise
    if (!groups) {
        sendError(res, 502, 'Failed to get groups from gamma')
        return
    }

    const group = getAuthorizedGroup(groups)
    if (!group) {
        sendError(res, errors.noPermission)
        return
    }

    const body: ResponseBody<UserResponse> = {
        data: convert.toUserResponse(dbUser, gammaUser, group),
    }
    res.json(body)
}

export async function getGroup(req: Request, res: Response) {
    const db = await database()

    const userId: UserId = getUserId(res)
    const groupId: GroupId = getGroupId(res)

    // Get group
    const gammagroups = await clientApi.getGroupsFor(userId)
    const gammaGroup = getAuthorizedGroup(gammagroups)
    if (!gammaGroup) {
        sendError(res, errors.noPermission)
        return
    }
    const group = convert.toGroup(gammaGroup)

    // Get members
    let userPromises: Promise<User>[]
    try {
        userPromises = (await db.getUsersInGroup(groupId)).map(async dbUser => {
            const gammaUser = await clientApi.getUser(dbUser.gammaid)
            return convert.toUser(dbUser, gammaUser)
        })
    } catch (e) {
        const message = `Failed to get users from gamma: ${e}`
        console.error(message)
        sendError(res, errors.invalidGamma)
        return
    }
    const members = await Promise.all(userPromises)

    const body: ResponseBody<GroupResponse> = { data: { group, members } }
    res.json(body)
}

export async function getTransactions(req: Request, res: Response) {
    const db = await database()
    const limit = parseInt(req.query.limit as string)
    const offset = parseInt(req.query.offset as string)

    const groupId: GroupId = getGroupId(res)

    const count = await db.countTransactionsInGroup(groupId)

    const dbTransactions = await db.getTransactionsInGroup(groupId)

    const transactions: Transaction<any>[] = (
        await Promise.all(
            dbTransactions.map(async dbTransaction => {
                const dbPurchasedItems = await db.getPurchasedItems(dbTransaction.id)
                if (dbPurchasedItems.length > 0) {
                    // Transaction is purchase
                    return convert.toPurchase(dbTransaction, dbPurchasedItems)
                }
                const dbDeposit = await db.getDeposit(dbTransaction.id)
                if (dbDeposit) {
                    // Transaction is deposit
                    return convert.toDeposit(dbTransaction, dbDeposit)
                }

                console.warn(`Transaction ${dbTransaction.id} has no purchased items or deposit`)
                return undefined
            })
        )
    ).filter(x => x !== undefined)

    const body: ResponseBody<TransactionsResponse> = { data: { transactions } }
    res.json(body)

    // TODO: Paginate transactions
}

export async function postPurchase(req: Request, res: Response) {
    const db = await database()

    const { userId: purchasedFor, items } = req.body as PostPurchaseBody

    const purchasedBy: UserId = getUserId(res)
    const groupId: GroupId = getGroupId(res)

    // Create transaction
    let dbTransaction: tableType.Transactions
    try {
        dbTransaction = await db.createTransaction(groupId, purchasedBy, purchasedFor)
    } catch (e) {
        const message = 'Failed to create purchase transaction, ' + e
        console.error(message)
        sendError(res, errors.unexpected(message))
        return
    }

    // Add purchase items
    const itemPromises = items.map(async item => {
        const dbItem = await getter.item(item.id, purchasedBy)

        return db.addPurchasedItem(
            dbTransaction.id, //
            item.quantity,
            item.purchasePrice,
            dbItem.id,
            dbItem.displayName,
            dbItem.icon
        )
    })
    await Promise.all(itemPromises)

    const transaction: Purchase = await getter.purchase(dbTransaction.id)
    const body: ResponseBody<TransactionResponse> = { data: { transaction } }
    res.json(body)
}

export async function postDeposit(req: Request, res: Response) {
    const db = await database()

    const { userId: purchasedFor, total } = req.body as PostDepositBody

    const purchasedBy: UserId = getUserId(res)
    const groupId: GroupId = getGroupId(res)

    // Create transaction
    let dbTransaction: tableType.Transactions
    try {
        dbTransaction = await db.createTransaction(groupId, purchasedBy, purchasedFor)
    } catch (e) {
        const message = 'Failed to create deposit transaction, ' + e
        console.error(message)
        sendError(res, errors.unexpected(message))
        return
    }

    let dbDeposit: tableType.Deposits
    try {
        dbDeposit = await db.createDeposit(dbTransaction.id, total)
    } catch (e) {
        const message = 'Failed to create deposit, ' + e
        console.error(message)
        sendError(res, errors.unexpected(message))
        return
    }

    const transaction: Deposit = convert.toDeposit(dbTransaction, dbDeposit)
    const body: ResponseBody<TransactionResponse> = { data: { transaction } }
    res.json(body)
}

export async function getItems(req: Request, res: Response) {
    const db = await database()
    const sort: ItemSortMode = req.query.sort as ItemSortMode
    const visibleOnly: boolean = req.query.visibleOnly === '1' || req.query.visibleOnly === 'true'

    const userId: UserId = getUserId(res)
    const groupId: GroupId = getGroupId(res)

    const dbItems = await db.getItemsInGroup(groupId)
    const itemPromises: Promise<Item>[] = dbItems
        .filter(dbItem => !(!dbItem.visible && visibleOnly))
        .map(async dbItem => {
            const [prices, favorite] = await Promise.all([
                db.getPricesForItem(dbItem.id), //
                db.isFavorite(userId, dbItem.id),
            ])
            if (prices.length == 0) {
                throw new Error('Invalid state, item must have at least one item')
            }
            const item: Item = convert.toItem(dbItem, prices, favorite)
            return item
        })
    const items = await Promise.all(itemPromises)

    // Sort by popularity by default and when two items are equal in order
    items.sort((a, b) => a.timesPurchased - b.timesPurchased)
    switch (sort) {
        case 'popular':
            break
        case 'cheap':
            items.sort((a, b) => a.prices[0].price - b.prices[0].price)
            break
        case 'expensive':
            items.sort((a, b) => b.prices[0].price - a.prices[0].price)
            break
        case 'new':
            items.sort((a, b) => a.addedTime - b.addedTime)
            break
        case 'old':
            items.sort((a, b) => b.addedTime - a.addedTime)
            break
        case 'name_a2z':
            items.sort((a, b) => a.displayName.localeCompare(b.displayName))
            break
        case 'name_z2a':
            items.sort((a, b) => b.displayName.localeCompare(a.displayName))
            break
    }
    const body: ResponseBody<ItemsResponse> = { data: { items } }
    res.json(body)
}

export async function postItem(req: Request, res: Response) {
    const { displayName, prices, icon } = req.body as PostItemBody
    const db = await database()
    const userId: UserId = getUserId(res)
    const groupId: GroupId = getGroupId(res)

    // Create item
    const dbItem = icon
        ? await db.createItem(groupId, displayName, icon) //
        : await db.createItem(groupId, displayName)

    // Create prices
    const dbPrices = await Promise.all(prices.map(price => db.addPrice(dbItem.id, price.price, price.displayName)))

    // Create
    const favorite = await db.isFavorite(userId, dbItem.id)

    const item = convert.toItem(dbItem, dbPrices, favorite)
    const body: ResponseBody<ItemResponse> = { data: { item } }
    res.json(body)
}

export async function getItem(req: Request, res: Response) {
    const itemId = parseInt(req.params.id)
    const db = await database()
    const userId: UserId = getUserId(res)

    const [dbItem, dbPrices, favorite] = await Promise.all([
        db.getItem(itemId), //
        db.getPricesForItem(itemId),
        db.isFavorite(userId, itemId),
    ])

    const groupId = getGroupId(res)
    if (!dbItem || dbItem.groupid !== groupId) {
        sendError(res, errors.itemNotExist)
        return
    }

    const data: ItemResponse = {
        item: convert.toItem(dbItem, dbPrices, favorite),
    }
    const body: ResponseBody<ItemResponse> = { data }

    res.json(body)
}

export async function patchItem(req: Request, res: Response) {
    const db = await database()
    const userId: UserId = getUserId(res)

    const itemId = parseInt(req.params.id)
    const { icon, displayName, visible, favorite, prices } = req.body as PatchItemBody

    // Update Items table
    const columns: (Extract<keyof tableType.Items, string> | undefined)[] = ['iconurl', 'displayname', 'visible']
    const values = [icon, displayName, visible]
    for (let i = 0; i < values.length; i++) {
        if (values[i] === undefined) columns[i] = undefined
    }

    await db.updateItem(
        itemId,
        columns.filter(x => x !== undefined),
        values.filter(x => x !== undefined)
    )

    if (favorite !== undefined) {
        if (favorite) {
            try {
                await db.addFavorite(userId, itemId)
            } catch (e) {
                // Item already a favorite
            }
        } else {
            await db.removeFavorite(userId, itemId)
        }
    }

    if (prices !== undefined) {
        await db.removePricesForItem(itemId)
        for (const price of prices) {
            await db.addPrice(itemId, price.price, price.displayName)
        }
    }

    let newItem: Item
    try {
        newItem = await getter.item(itemId, userId)
    } catch {
        const message = `Failed to get item ${itemId} from database after patch`
        console.error(message)
        sendError(res, errors.unexpected(message))
        return
    }

    const data: ItemResponse = { item: newItem }
    const body: ResponseBody<ItemResponse> = { data }

    res.json(body)
}

export async function deleteItem(req: Request, res: Response) {
    const db = await database()

    const itemId = parseInt(req.params.id)

    await db.deleteItem(itemId)
    res.end()
}
