import { body, Meta, param, query } from 'express-validator'
import { GroupId, UserId } from 'gammait'
import { database } from '../config/clients'
import { errors } from '../errors'
import { verifyToken } from './validateToken'
import { ItemSortMode } from '../types'

export async function checkUserExists(value: string): Promise<boolean> {
    const db = await database()
    return await db.userExists(value as UserId)
}

function getGroupId(meta: Meta): GroupId {
    const auth = meta.req.headers?.authorization
    const token = auth.split(' ')[1]
    const jwt = verifyToken(token)
    const { groupId } = jwt
    return groupId
}

export async function checkItemExists(value: string, meta: Meta): Promise<boolean> {
    const db = await database()
    const groupId = getGroupId(meta)
    return await db.itemExistsInGroup(parseInt(value), groupId)
}

export async function checkDisplayNameUnique(value: string, meta: Meta): Promise<void> {
    const db = await database()
    const groupId = getGroupId(meta)
    if (await db.itemNameExistsInGroup(value, groupId)) {
        throw new Error(errors.displayNameNotUnique[1])
    }
}

// Validation chains
export const login = () => [
    query('code').isHexadecimal(),
    //
]

export const getUser = () => []

export const getTransactions = () => [
    body('limit').default(50).isInt(),
    body('offset').default(0).isInt(),
    //
]

export const postPurchase = () => [
    body('userId').isString().trim().isUUID().bail().custom(checkUserExists),
    body('items').isArray(),
    body('items.*.id').isInt(),
    body('items.*.count').isInt(),
    body('items.*.purchasePrice').isDecimal(),
    //
]

export const postDeposit = () => [
    body('userId').isString().trim().isUUID().bail().custom(checkUserExists),
    body('total').isDecimal(),
    //
]

export const itemSortModes = <const>['popular', 'cheap', 'expensive', 'new', 'old']
export const getItems = () => [
    body('sort').default('popular').isString().trim().isIn(itemSortModes),
    body('visibleOnly').default(true).isBoolean(),
    //
]

export const postItem = () => [
    body('displayName').isString().trim().notEmpty().bail().escape().custom(checkDisplayNameUnique),
    body('prices').isArray(),
    body('prices.*.price').isDecimal(),
    body('prices.*.displayName').optional().isString().trim().notEmpty().escape(),
    body('icon').optional().isURL(),
    //
]

export const getItem = () => [
    param('id').isInt().bail().custom(checkItemExists),
    //
]

export const patchItem = () => [
    param('id').isInt().bail().custom(checkItemExists),
    body('icon').optional().escape().isURL(),
    body('displayName').optional().isString().trim().notEmpty().bail().escape().custom(checkDisplayNameUnique),
    body('prices').optional().isArray(),
    body('prices.*.price').isDecimal(),
    body('prices.*.displayName').isString().trim().notEmpty().escape(),
    body('visible').optional().isBoolean(),
    //
]

export const deleteItem = () => [
    param('id').isInt().bail().custom(checkItemExists),
    //
]
