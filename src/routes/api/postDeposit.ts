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

    const createdBy: UserId = getUserId(res)
    const groupId: GroupId = getGroupId(res)

    const userBy = await db.getUser(createdBy)
    if (!userBy) {
        sendError(res, ApiError.Unauthorized)
        return
    }
    const userFor = await db.getUser(createdFor)
    if (!userFor) {
        sendError(res, ApiError.UserNotExist)
        return
    }

    // Create transaction
    let dbTransaction: tableType.Transactions
    try {
        dbTransaction = await db.createTransaction(groupId, createdBy, createdFor)
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
    const balance = userFor.balance + total
    await db.setBalance(createdFor, balance)

    const transaction: Deposit = convert.toDeposit(dbTransaction, dbDeposit)
    const body: ResponseBody<CreatedTransactionResponse> = {
        data: { transaction, balance },
    }

    const resourceUri = req.baseUrl + `/group/transaction/${transaction.id}`
    res.status(201).set('Location', resourceUri).json(body)
}