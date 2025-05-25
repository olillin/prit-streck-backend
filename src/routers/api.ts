import { Router } from 'express'
import validateToken from '../middleware/validateToken'
import validationErrorHandler from '../middleware/validationErrorHandler'
import * as validators from '../middleware/validators'
import * as apiRoutes from '../routes/api'
import setHeader from "../middleware/setHeader";

async function createApiRouter(): Promise<Router> {
    const api = Router()

    api.use(validateToken)

    type Method =
        | 'all'
        | 'get'
        | 'post'
        | 'put'
        | 'delete'
        | 'patch'
        | 'options'
        | 'head'
    type HandlerName = keyof typeof validators & keyof typeof apiRoutes
    const routes: [Method, string, HandlerName][] = [
        ['get', '/user', 'getUser'],
        ['get', '/group', 'getGroup'],
        ['get', '/group/transaction', 'getTransactions'],
        ['get', '/group/transaction/:id', 'getTransaction'],
        ['post', '/group/purchase', 'postPurchase'],
        ['post', '/group/deposit', 'postDeposit'],
        ['post', '/group/stock', 'postStockUpdate'],
        ['get', '/group/item', 'getItems'],
        ['get', '/group/item/:id', 'getItem'],
        ['post', '/group/item', 'postItem'],
        ['patch', '/group/item/:id', 'patchItem'],
        ['delete', '/group/item/:id', 'deleteItem'],
    ]

    for (const [method, path, name] of routes) {
        // Get allowed methods on this path
        const methods: Set<string> = new Set(
            routes
                .filter(other => other[1] === path)
                .map(other => other[0].toUpperCase())
        )
        // Register listeners
        api[method](
            path,
            setHeader('Allow', methods),
            ...validators[name](),
            validationErrorHandler,
            apiRoutes[name]
        )
    }

    return api
}
export default createApiRouter
