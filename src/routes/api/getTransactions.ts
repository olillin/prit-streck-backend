import {Request, Response} from "express";
import {database} from "../../config/clients";
import {GroupId} from "gammait";
import {getGroupId} from "../../middleware/validateToken";
import {ResponseBody, Transaction, TransactionsResponse, TransactionType} from "../../types";
import * as convert from "../../util/convert";

export default async function getTransactions(req: Request, res: Response) {
    const limit = parseInt(req.query.limit as string)
    const offset = parseInt(req.query.offset as string)

    const groupId: GroupId = getGroupId(res)

    const count = await db.countTransactionsInGroup(groupId)

    const dbTransactions = await db.getTransactionsInGroup(groupId)

    const transactions: Transaction<TransactionType>[] = (
        await Promise.all(
            dbTransactions.map(async dbTransaction => {
                const dbPurchasedItems = await db.getPurchasedItems(
                    dbTransaction.id
                )
                if (dbPurchasedItems.length > 0) {
                    // Transaction is purchase
                    return convert.toPurchase(dbTransaction, dbPurchasedItems)
                }
                const dbDeposit = await db.getDeposit(dbTransaction.id)
                if (dbDeposit) {
                    // Transaction is deposit
                    return convert.toDeposit(dbTransaction, dbDeposit)
                }

                console.warn(
                    `Transaction ${dbTransaction.id} has no purchased items or deposit`
                )
                return undefined
            })
        )
    ).filter(x => x !== undefined)

    const body: ResponseBody<TransactionsResponse> = { data: { transactions } }
    res.json(body)

    // TODO: Paginate transactions
}