import { body, Meta, oneOf, param, query } from 'express-validator'
import { GroupId, UserId } from 'gammait'
import { database } from '../config/clients'
import { verifyToken } from './validateToken'
import { ApiError } from '../errors'

export async function checkUserExists(value: string): Promise<void> {
    const db = await database()
    const exists = await db.userExists(value as UserId)
    if (!exists) {
        throw ApiError.UserNotExist
    }
}

function getGroupId(meta: Meta): GroupId {
    const auth = meta.req.headers?.authorization
    const token = auth.split(' ')[1]
    const jwt = verifyToken(token)
    const { groupId } = jwt
    return groupId
}

export async function checkItemExists(
    value: string,
    meta: Meta
): Promise<void> {
    const db = await database()
    const groupId = getGroupId(meta)
    const exists = await db.itemExistsInGroup(parseInt(value), groupId)
    if (!exists) {
        throw ApiError.ItemNotExist
    }
}

export async function checkTransactionExists(
    value: string,
    meta: Meta
): Promise<void> {
    const db = await database()
    const groupId = getGroupId(meta)
    const exists = await db.transactionExistsInGroup(parseInt(value), groupId)
    if (!exists) {
        throw ApiError.TransactionNotExist
    }
}

export async function checkPurchasedItemVisible(value: string): Promise<void> {
    const db = await database()
    const visible = await db.isItemVisible(parseInt(value))
    if (!visible) {
        throw ApiError.PurchaseInvisible
    }
}

export async function checkDisplayNameUnique(
    value: string,
    meta: Meta
): Promise<void> {
    const db = await database()
    const groupId = getGroupId(meta)
    const nameExists = await db.itemNameExistsInGroup(value, groupId)
    if (nameExists) {
        throw ApiError.DisplayNameNotUnique
    }
}

// Validation chains
export const login = () => [
    query('code').exists().withMessage(ApiError.NoAuthorizationCode),
]

export const getUser = () => []

export const getGroup = () => []

export const getTransactions = () => [
    query('limit')
        .default(50)
        .isInt({ min: 1, max: 100 })
        .withMessage(ApiError.InvalidLimit),
    query('offset')
        .default(0)
        .isInt({ min: 0 })
        .withMessage(ApiError.InvalidOffset),
]

export const getTransaction = () => [
    param('id').exists().isInt().withMessage(ApiError.InvalidTransactionId).bail().custom(checkTransactionExists)
]

export const postPurchase = () => [
    body('userId')
        .exists()
        .isString()
        .trim()
        .isUUID()
        .withMessage(ApiError.InvalidUserId)
        .bail()
        .custom(checkUserExists),
    body('items')
        .exists()
        .isArray({ min: 1 })
        .withMessage(ApiError.PurchaseNothing),
    body('items.*.id')
        .exists()
        .isInt()
        .withMessage(ApiError.InvalidItemId)
        .bail()
        .custom(checkItemExists)
        .bail()
        .custom(checkPurchasedItemVisible)
        .withMessage(ApiError.PurchaseInvisible),
    body('items.*.quantity')
        .exists()
        .isInt({ min: 1 })
        .withMessage(ApiError.ItemCount),
    body('items.*.purchasePrice').exists().isObject(),
    body('items.*.purchasePrice.price').exists().isDecimal(),
    body('items.*.purchasePrice.displayName').exists().isString().trim(),
]

export const postDeposit = () => [
    body('userId')
        .exists()
        .isString()
        .trim()
        .isUUID()
        .withMessage(ApiError.InvalidUserId)
        .bail()
        .custom(checkUserExists),
    body('total').exists().isDecimal().withMessage(ApiError.InvalidTotal),
]

export const itemSortModes = <const>[
    'popular',
    'cheap',
    'expensive',
    'new',
    'old',
    'name_a2z',
    'name_z2a',
]
export const getItems = () => [
    query('sort')
        .default('popular')
        .isString()
        .trim()
        .isIn(itemSortModes)
        .withMessage(ApiError.UnknownSortMode),
    query('visibleOnly').default(true).isBoolean(),
]

export const postItem = () => [
    body('displayName')
        .exists()
        .isString()
        .bail()
        .trim()
        .notEmpty()
        .bail()
        .custom(checkDisplayNameUnique),
    body('prices')
        .exists()
        .isArray({ min: 1 })
        .withMessage(ApiError.MissingPrices),
    body('prices.*.price').exists().isDecimal(),
    body('prices.*.displayName').exists().isString().bail().trim().notEmpty(),
    body('icon').optional().isURL(),
]

export const getItem = () => [
    param('id')
        .exists()
        .isInt()
        .withMessage(ApiError.InvalidItemId)
        .bail()
        .custom(checkItemExists),
]

export const patchItem = () => [
    param('id')
        .exists()
        .isInt()
        .withMessage(ApiError.InvalidItemId)
        .bail()
        .custom(checkItemExists),
    oneOf([
        body('icon')
            .optional()
            .isString()
            .withMessage(ApiError.InvalidUrl)
            .trim()
            .isURL()
            .withMessage(ApiError.InvalidUrl),
        body('icon').not().exists(),
    ]),
    body('displayName')
        .optional()
        .isString()
        .trim()
        .custom(checkDisplayNameUnique),
    body('prices')
        .optional()
        .isArray({ min: 1 })
        .withMessage(ApiError.MissingPrices),
    body('prices.*.price').isDecimal(),
    body('prices.*.displayName').isString().trim().notEmpty(),
    body('visible').optional().isBoolean(),
]

export const deleteItem = () => [
    param('id').exists().isInt().bail().custom(checkItemExists),
]
