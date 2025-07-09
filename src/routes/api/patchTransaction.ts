import {Request, Response} from "express";
import {database} from "../../config/clients";
import {TransactionResponse, PatchTransactionBody, ResponseBody} from "../../types";
import {TransactionFlagsMap} from "../../flags";

export default async function patchTransaction(req: Request, res: Response) {
    const transactionId = parseInt(req.params.id)
    const { removed } = req.body as PatchTransactionBody

    const flags: Partial<TransactionFlagsMap> = {
        removed: removed,
    }

    // Update transactions table
    const newTransaction = await database.updateTransaction(
        transactionId,
        flags,
    )

    const data: TransactionResponse = { transaction: newTransaction }
    const body: ResponseBody<TransactionResponse> = { data }

    res.json(body)
}