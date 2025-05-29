import {Request, Response} from "express";
import {ResponseBody, TransactionResponse} from "../../types";
import {database} from "../../config/clients";

export default async function getTransaction(req: Request, res: Response) {
    const transactionId = parseInt(req.params.id)
    const transaction = await database.getTransaction(transactionId)
    const body: ResponseBody<TransactionResponse> = {data: {transaction}}
    res.json(body)
}