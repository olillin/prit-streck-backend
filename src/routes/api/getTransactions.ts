import {Request, Response} from "express";
import {database} from "../../config/clients";
import {getGroupId} from "../../middleware/validateToken";
import {ResponseBody, TransactionsResponse} from "../../types";

export default async function getTransactions(req: Request, res: Response) {
    const limit = parseInt(req.query.limit as string)
    const offset = parseInt(req.query.offset as string)

    const groupId: number = getGroupId(res)

    const count = await database.countTransactionsInGroup(groupId)

    const transactions = await database.getTransactionsInGroup(groupId)

    const body: ResponseBody<TransactionsResponse> = { data: { transactions } }
    res.json(body)

    // TODO: Paginate transactions
}