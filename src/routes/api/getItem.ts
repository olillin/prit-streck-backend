import {Request, Response} from "express";
import {database} from "../../config/clients";
import {getUserId} from "../../middleware/validateToken";
import {ApiError, sendError} from "../../errors";
import {ItemResponse, ResponseBody} from "../../types";
import * as convert from "../../util/convert";
import {splitFullItemWithPrices} from "../../util/convert";

export default async function getItem(req: Request, res: Response) {
    const itemId = parseInt(req.params.id)
    const userId: number = getUserId(res)

    const dbItemWithPrices = await database.getFullItemWithPrices(itemId, userId)

    if (dbItemWithPrices.length === 0) {
        sendError(res, ApiError.ItemNotExist)
        return
    }

    const data: ItemResponse = {
        item: convert.toItem(...splitFullItemWithPrices(dbItemWithPrices))
    }
    const body: ResponseBody<ItemResponse> = { data }

    res.json(body)
}