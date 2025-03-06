import { Router } from 'express'
import validateToken from '../middleware/validateToken'
import validationErrorHandler from '../middleware/validationErrorHandler'
import * as validate from '../middleware/validators'
import * as route from '../routes/api'

async function createApiRouter(): Promise<Router> {
    const api = Router()

    api.use(validateToken)

    type Method = 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head'
    type HandlerName = keyof typeof validate & keyof typeof route
    const routes: [Method, string, HandlerName][] = [
        ['get', '/user', 'getUser'],
        ['get', '/group/purchase', 'getPurchases'],
        ['post', '/group/purchase', 'postPurchase'],
        ['get', '/group/item', 'getItems'],
        ['post', '/group/item', 'postItem'],
        ['get', '/group/item/:id', 'getItem'],
        ['patch', '/group/item/:id', 'patchItem'],
        ['delete', '/group/item/:id', 'deleteItem'],
    ]

    for (const [method, path, name] of routes) {
        api[method](path, ...validate[name](), validationErrorHandler, route[name])
    }

    api.get('/test', (req, res) => {
        res.end('Hello world')
    })

    return api
}
export default createApiRouter
