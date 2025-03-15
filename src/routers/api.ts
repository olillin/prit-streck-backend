import { Router } from 'express'
import validateToken from '../middleware/validateToken'
import validationErrorHandler from '../middleware/validationErrorHandler'
import * as validate from '../middleware/validators'
import * as route from '../routes/api'

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
    type HandlerName = keyof typeof validate & keyof typeof route
    const routes: [Method, string, HandlerName][] = [
        ['get', '/user', 'getUser'],
        ['get', '/group', 'getGroup'],
        ['get', '/group/transaction', 'getTransactions'],
        ['get', '/group/transaction/:id', 'getTransaction'],
        ['post', '/group/purchase', 'postPurchase'],
        ['post', '/group/deposit', 'postDeposit'],
        ['get', '/group/item', 'getItems'],
        ['get', '/group/item/:id', 'getItem'],
        ['post', '/group/item', 'postItem'],
        ['patch', '/group/item/:id', 'patchItem'],
        ['delete', '/group/item/:id', 'deleteItem'],
    ]

    for (const [method, path, name] of routes) {
        api[method](
            path,
            ...validate[name](),
            validationErrorHandler,
            route[name]
        )
    }

    api.get('/test', (req, res) => {
        res.end('Hello world')
    })

    return api
}
export default createApiRouter
