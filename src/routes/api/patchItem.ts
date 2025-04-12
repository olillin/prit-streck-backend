import {Request, Response} from "express";
import {database} from "../../config/clients";
import {getUserId} from "../../middleware/validateToken";
import {ItemResponse, PatchItemBody, ResponseBody} from "../../types";
import {LegalItemColumn} from "../../database/client";

export default async function patchItem(req: Request, res: Response) {
    const userId: number = getUserId(res)

    const itemId = parseInt(req.params.id)
    const { icon, displayName, visible, favorite, prices } = req.body as PatchItemBody

    // Update Items table
    const columns: (LegalItemColumn | undefined)[] = [
        'icon_url',
        'display_name',
        'visible',
    ]
    const values = [icon, displayName, visible]
    for (let i = 0; i < values.length; i++) {
        if (values[i] === undefined) columns[i] = undefined
    }

    const newItem = await database.updateItem(
        itemId,
        userId,
        columns.filter(x => x !== undefined),
        values.filter(x => x !== undefined),
        favorite,
        prices,
    )

    const data: ItemResponse = { item: newItem }
    const body: ResponseBody<ItemResponse> = { data }

    res.json(body)
}