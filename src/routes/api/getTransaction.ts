import {Request, Response} from "express";
import * as getter from "../../util/getter";
import {ResponseBody, TransactionResponse} from "../../types";

export default async function getTransaction(req: Request, res: Response) {
    const transactionId = parseInt(req.params.id)
    const transaction = await getter.transaction(transactionId)
    const body: ResponseBody<TransactionResponse> = {data: {transaction}}
    res.json(body)
}