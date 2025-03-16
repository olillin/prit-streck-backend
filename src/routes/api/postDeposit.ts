import {Request, Response} from "express";
import {database} from "../../config/clients";
import {CreatedTransactionResponse, Deposit, PostDepositBody, ResponseBody} from "../../types";
import {GroupId, UserId} from "gammait";
import {getGroupId, getUserId} from "../../middleware/validateToken";
import {ApiError, sendError, unexpectedError} from "../../errors";
import * as tableType from "../../database/types";
import * as convert from "../../util/convert";

export default async function postDeposit(req: Request, res: Response) {
    const db = await database()

    const { userId: createdFor, total } = req.body as PostDepositBody

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
        const message = 'Failed to create deposit transaction, ' + e
        console.error(message)
        sendError(res, unexpectedError(message))
        return
    }

    let dbDeposit: tableType.Deposits
    try {
        dbDeposit = await db.createDeposit(dbTransaction.id, total)
    } catch (e) {
        const message = 'Failed to create deposit, ' + e
        console.error(message)
        sendError(res, unexpectedError(message))
        return
    }

    // Update user balance
    const balance = user.balance + total
    await db.setBalance(userId, balance)

    const transaction: Deposit = convert.toDeposit(dbTransaction, dbDeposit)
    const body: ResponseBody<CreatedTransactionResponse> = {
        data: { transaction, balance },
    }

    const resourceUri = req.baseUrl + `/group/transaction/${transaction.id}`
    res.status(201).set('Location', resourceUri).json(body)
}