import {Request, Response} from "express";
import {database} from "../../config/clients";
import {CreatedTransactionResponse, PostPurchaseBody, ResponseBody} from "../../types";
import {getGroupId, getUserId} from "../../middleware/validateToken";
import {sendError, unexpectedError} from "../../errors";

export default async function postPurchase(req: Request, res: Response) {
    const {userId: createdFor, items} = req.body as PostPurchaseBody

    const groupId: number = getGroupId(res)
    const createdBy: number = getUserId(res)

    const purchase = await database.createPurchase(groupId, createdBy, createdFor, items)
    const user = await database.getFullUser(createdFor)
    if (!user) {
        sendError(res, unexpectedError("Failed to get user balance after creating purchase"))
        return
    }
    const balance = user.balance
    const body: ResponseBody<CreatedTransactionResponse> = {
        data: {transaction: purchase, balance},
    }

    const resourceUri = req.baseUrl + `/group/transaction/${purchase.id}`
    res.status(201).set('Location', resourceUri).json(body)
}