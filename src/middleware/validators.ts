import { body, Meta, param, query } from 'express-validator'
import { GroupId, UserId } from 'gammait'
import { database } from '../config/clients'
import { errors } from '../errors'
import { verifyToken } from './validateToken'
import * as getter from '../util/getter'

export async function checkUserExists(value: string): Promise<void> {
    const db = await database()
    const exists = await db.userExists(value as UserId)
    if (!exists) {
        throw new Error('User does not exist')
    }
}

function getGroupId(meta: Meta): GroupId {
    const auth = meta.req.headers?.authorization
    const token = auth.split(' ')[1]
    const jwt = verifyToken(token)
    const { groupId } = jwt
    return groupId
}

export async function checkItemExists(value: string, meta: Meta): Promise<void> {
    const db = await database()
    const groupId = getGroupId(meta)
    const exists = await db.itemExistsInGroup(parseInt(value), groupId)
    if (!exists) {
        throw new Error('Item does not exist')
    }
}

export async function checkItemVisible(value: string, meta: Meta): Promise<void> {
    const db = await database()
    const visible = await db.isItemVisible(parseInt(value))
    if (!visible) {
        throw new Error('Item is not visible')
    }
}

export async function checkDisplayNameUnique(value: string, meta: Meta): Promise<void> {
    const db = await database()
    const groupId = getGroupId(meta)
    const nameExists = await db.itemNameExistsInGroup(value, groupId)
    if (nameExists) {
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
    query('limit').default(50).isInt({ min: 1, max: 100 }),
    query('offset').default(0).isInt({ min: 0 }),
    //
]

export const postPurchase = () => [
    body('userId').isString().trim().isUUID().bail().custom(checkUserExists),
    body('items').isArray({ min: 1 }),
    body('items.*.id').isInt().bail().custom(checkItemExists).bail().custom(checkItemVisible),
    body('items.*.quantity').isInt({ min: 1 }),
    body('items.*.purchasePrice').isObject(),
    body('items.*.purchasePrice.price').isDecimal(),
    body('items.*.purchasePrice.displayName').isString().bail().trim().notEmpty().escape(),
    //
]

export const postDeposit = () => [
    body('userId').isString().trim().isUUID().bail().custom(checkUserExists),
    body('total').isDecimal(),
    //
]

export const itemSortModes = <const>['popular', 'cheap', 'expensive', 'new', 'old', 'name_a2z', 'name_z2a']
export const getItems = () => [
    query('sort').default('popular').isString().trim().isIn(itemSortModes),
    query('visibleOnly').default(true).isBoolean({}),
    //
]

export const postItem = () => [
    body('displayName').isString().bail().trim().notEmpty().bail().escape().custom(checkDisplayNameUnique),
    body('prices').isArray(),
    body('prices.*.price').isDecimal(),
    body('prices.*.displayName').isString().bail().trim().notEmpty().escape(),
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
