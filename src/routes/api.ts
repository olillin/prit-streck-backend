import { Request, Response } from 'express'
import { ClientApi, GroupId, UserId } from 'gammait'
import { userAvatarUrl } from 'gammait/urls'
import DatabaseClient from '../database/client'
import { errors, sendError } from '../errors'
import { getGroupId, getUserId } from '../middleware/validateToken'
import { Item, ItemsResponse, ResponseBody, User } from '../types'

export function getUser(database: DatabaseClient, client: ClientApi) {
    return async (req: Request, res: Response) => {
        const userId: UserId = getUserId(res)

        const rowPromise = database.getUser(userId).catch(reason => {
            console.log(reason)
            sendError(res, 500, 'Failed to fetch user from database')
        })
        const gammaUserPromise = client.getUser(userId).catch(reason => {
            console.log(reason)
            sendError(res, 404, 'User does not exist')
        })
        const groupsPromise = client.getGroupsFor(userId).catch(reason => {
            console.log(reason)
            sendError(res, 500, 'Failed to fetch groups')
        })

        console.log('Waiting for row')
        const row = await rowPromise
        if (!row) {
            sendError(res, 404, 'User does not exist')
            return
        }

        console.log('Waiting for user')
        const gammaUser = await gammaUserPromise
        if (!gammaUser) {
            sendError(res, 502, 'Failed to get user from gamma')
            return
        }

        console.log('Waiting for groups')
        const groups = await groupsPromise
        if (!groups) {
            sendError(res, 502, 'Failed to get groups from gamma')
            return
        }

        console.log('Res')
        const user: User = {
            id: userId,
            balance: row.balance,
            avatarUrl: userAvatarUrl(userId),
            firstName: gammaUser.firstName,
            lastName: gammaUser.lastName,
            nick: gammaUser.nick,
        }
        res.json(user)
    }
}

export function getPurchases(database: DatabaseClient) {
    return async (req: Request, res: Response) => {}
}

export function postPurchase(database: DatabaseClient) {
    return async (req: Request, res: Response) => {}
}

export function getItems(database: DatabaseClient) {
    return async (req: Request, res: Response) => {
        const sortModes = <const>['recentlyPurchased', 'popular', 'cheap', 'expensive', 'new', 'old']
        type SortMode = (typeof sortModes)[number]

        const sort: SortMode = req.body.sort ?? 'recentlyPurchased'
        if (!sortModes.includes(sort)) {
            sendError(res, errors.unknownSortMode)
            return
        }
        const visibleOnly: boolean = !!(req.body.visibleOnly ?? true)

        const groupId: GroupId = getGroupId(res)
        const dbItems = (await database.getItemsInGroup(groupId))!
        const items: Promise<Item>[] = dbItems
            .filter(dbItem => !(!dbItem.visible && visibleOnly))
            .map(async dbItem => {
                const prices = await database.getPricesForItem(dbItem.id)
                const item: Item = {
                    id: dbItem.id,
                    addedTime: dbItem.addedtime.getTime(),
                    displayName: dbItem.displayname,
                    prices: prices.map(price => ({
                        price: price.price,
                        displayName: price.displayname,
                    })),
                    timesPurchased: dbItem.timespurchased,
                    visible: dbItem.visible,
                    ...(dbItem.iconurl !== undefined && { icon: dbItem.iconurl }),
                }
                return item
            })
        Promise.all(items).then(items => {
            switch (sort) {
                case 'recentlyPurchased':
                    sendError(res, 500, 'Unimplemented sorting mode')
                    break
                case 'popular':
                    items.sort((a, b) => a.timesPurchased - b.timesPurchased)
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
            }
            const data: ItemsResponse = {
                items,
            }
            const body: ResponseBody = {
                data,
            }
            res.json(body)
        })
    }
}

export function postItem(database: DatabaseClient) {
    return async (req: Request, res: Response) => {}
}

export function getItem(database: DatabaseClient) {
    return async (req: Request, res: Response) => {}
}

export function putItem(database: DatabaseClient) {
    return async (req: Request, res: Response) => {}
}
export function deleteItem(database: DatabaseClient) {
    return async (req: Request, res: Response) => {}
}
