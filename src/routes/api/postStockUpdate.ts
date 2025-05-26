import {Request, Response} from "express";
import {database} from "../../config/clients";
import {PostStockUpdateBody, ResponseBody, TransactionResponse} from "../../types";
import {getGroupId, getUserId} from "../../middleware/validateToken";

export default async function postStockUpdate(req: Request, res: Response) {
    const {items, comment} = req.body as PostStockUpdateBody

    const groupId: number = getGroupId(res)
    const createdBy: number = getUserId(res)

    const stockUpdate = await database.createStockUpdate(groupId, createdBy, comment, items)
    const body: ResponseBody<TransactionResponse> = {
        data: {transaction: stockUpdate},
    }

    const resourceUri = req.baseUrl + `/group/transaction/${stockUpdate.id}`
    res.status(201).set('Location', resourceUri).json(body)
}