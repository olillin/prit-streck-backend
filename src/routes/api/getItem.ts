import {Request, Response} from "express";
import {database} from "../../config/clients";
import {UserId} from "gammait";
import {getGroupId, getUserId} from "../../middleware/validateToken";
import {ApiError, sendError} from "../../errors";
import {ItemResponse, ResponseBody} from "../../types";
import * as convert from "../../util/convert";

export default async function getItem(req: Request, res: Response) {
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
        sendError(res, ApiError.ItemNotExist)
        return
    }

    const data: ItemResponse = {
        item: convert.toItem(dbItem, dbPrices, favorite),
    }
    const body: ResponseBody<ItemResponse> = { data }

    res.json(body)
}