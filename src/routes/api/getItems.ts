import {Request, Response} from "express";
import {database} from "../../config/clients";
import {ItemSortMode, ItemsResponse, ResponseBody} from "../../types";
import {getGroupId, getUserId} from "../../middleware/validateToken";
import * as convert from "../../util/convert";
import {splitFullItemWithPrices} from "../../util/convert";

export default async function getItems(req: Request, res: Response) {
    const sort: ItemSortMode = req.query.sort as ItemSortMode
    const visibleOnly: boolean = req.query.visibleOnly === '1' || req.query.visibleOnly === 'true'

    const userId: number = getUserId(res)
    const groupId: number = getGroupId(res)

    const dbFullItemsWithPrices = await database.getFullItemsWithPricesInGroup(groupId, userId)
    const visibleItems = dbFullItemsWithPrices
        .filter(dbItem => !(!dbItem.visible && visibleOnly))
    const groupedItems = Map.groupBy(visibleItems, (dbItem) => dbItem.id)
    const items = Array.from(groupedItems.values())
        .map(dbFullItemWithPrices => convert.toItem(...splitFullItemWithPrices(dbFullItemWithPrices)))

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
    const body: ResponseBody<ItemsResponse> = {data: {items}}
    res.json(body)
}