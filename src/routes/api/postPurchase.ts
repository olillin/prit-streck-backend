import {Request, Response} from "express";
import {database} from "../../config/clients";
import {CreatedTransactionResponse, PostPurchaseBody, Purchase, ResponseBody} from "../../types";
import {GroupId, UserId} from "gammait";
import {getGroupId, getUserId} from "../../middleware/validateToken";
import {ApiError, sendError, unexpectedError} from "../../errors";
import * as tableType from "../../database/types";
import * as getter from "../../util/getter";

export default async function postPurchase(req: Request, res: Response) {
    const db = await database()

    const {userId: createdFor, items} = req.body as PostPurchaseBody

    const userId: UserId = getUserId(res)
    const groupId: GroupId = getGroupId(res)

    const user = await db.getUser(userId)
    if (!user) {
        sendError(res, ApiError.UserNotExist)
        return
    }

    // Create transaction
    let dbTransaction: tableType.Transactions
    try {
        dbTransaction = await db.createTransaction(groupId, userId, createdFor)
    } catch (e) {
        const message = 'Failed to create purchase transaction, ' + e
        console.error(message)
        sendError(res, unexpectedError(message))
        return
    }

    // Add purchase items
    let total = 0

    const itemPromises = items.map(async item => {
        const dbItem = await getter.item(item.id, userId)

        // Update purchase total
        total += item.purchasePrice.price * item.quantity

        // Update times purchased
        const timesPurchased = dbItem.timesPurchased + item.quantity
        await db.updateItem(dbItem.id, ['timespurchased'], [timesPurchased])

        return db.addPurchasedItem(
            dbTransaction.id, //
            item.quantity,
            item.purchasePrice,
            dbItem.id,
            dbItem.displayName,
            dbItem.icon
        )
    })
    await Promise.all(itemPromises)

    // Update user balance
    const balance = user.balance - total
    await db.setBalance(userId, balance)

    const transaction: Purchase = await getter.purchase(dbTransaction.id)
    const body: ResponseBody<CreatedTransactionResponse> = {
        data: {transaction, balance},
    }

    const resourceUri = req.baseUrl + `/group/transaction/${transaction.id}`
    res.status(201).set('Location', resourceUri).json(body)
}