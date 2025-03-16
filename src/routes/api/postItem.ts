import {Request, Response} from "express";
import {ItemResponse, PostItemBody, ResponseBody} from "../../types";
import {database} from "../../config/clients";
import {GroupId, UserId} from "gammait";
import {getGroupId, getUserId} from "../../middleware/validateToken";
import * as convert from "../../util/convert";

export default async function postItem(req: Request, res: Response) {
    const { displayName, prices, icon } = req.body as PostItemBody
    const db = await database()
    const userId: UserId = getUserId(res)
    const groupId: GroupId = getGroupId(res)

    // Create item
    const dbItem = icon
        ? await db.createItem(groupId, displayName, icon) //
        : await db.createItem(groupId, displayName)

    // Create prices
    const dbPrices = await Promise.all(
        prices.map(price =>
            db.addPrice(dbItem.id, price.price, price.displayName)
        )
    )

    // Create
    const favorite = await db.isFavorite(userId, dbItem.id)

    const item = convert.toItem(dbItem, dbPrices, favorite)
    const body: ResponseBody<ItemResponse> = { data: { item } }

    const resourceUri = req.baseUrl + `/group/item/${item.id}`
    res.status(201).set('Location', resourceUri).json(body)
}