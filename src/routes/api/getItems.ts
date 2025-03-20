import {Request, Response} from "express";
import {database} from "../../config/clients";
import {Item, ItemSortMode, ItemsResponse, ResponseBody} from "../../types";
import {GroupId, UserId} from "gammait";
import {getGroupId, getUserId} from "../../middleware/validateToken";
import * as convert from "../../util/convert";

export default async function getItems(req: Request, res: Response) {
    const db = await database()
    const sort: ItemSortMode = req.query.sort as ItemSortMode
    const visibleOnly: boolean =
        req.query.visibleOnly === '1' || req.query.visibleOnly === 'true'

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
                throw new Error(
                    'Invalid state, item must have at least one item'
                )
            }
            const item: Item = convert.toItem(dbItem, prices, favorite)
            return item
        })
    const items = await Promise.all(itemPromises)

    // Sort by popularity by default and when two items are equal in order
    items.sort((a, b) => b.timesPurchased - a.timesPurchased)
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