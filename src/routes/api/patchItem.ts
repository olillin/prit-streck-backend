import {Request, Response} from "express";
import {database} from "../../config/clients";
import {UserId} from "gammait";
import {getUserId} from "../../middleware/validateToken";
import {Item, ItemResponse, PatchItemBody, ResponseBody} from "../../types";
import {LegalItemColumn} from "../../database/client";
import * as getter from "../../util/getter";
import {sendError, unexpectedError} from "../../errors";

export default async function patchItem(req: Request, res: Response) {
    const userId: UserId = getUserId(res)

    const itemId = parseInt(req.params.id)
    const { icon, displayName, visible, favorite, prices } =
        req.body as PatchItemBody

    // Update Items table
    const columns: (LegalItemColumn | undefined)[] = [
        'iconurl',
        'displayname',
        'visible',
    ]
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
            } catch {
                // Item already a favorite, do nothing
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
        sendError(res, unexpectedError(message))
        return
    }

    const data: ItemResponse = { item: newItem }
    const body: ResponseBody<ItemResponse> = { data }

    res.json(body)
}