import { Router } from 'express'
import { ClientApi } from 'gammait'
import DatabaseClient from '../database/client'
import validateToken from '../middleware/validateToken'
import { deleteItem, getItem, getItems, getPurchases, getUser, postItem, postPurchase, putItem } from '../routes/api'

function createApiRouter(authorization: string, database: DatabaseClient): Router {
    const api = Router()
    const client = new ClientApi({
        authorization: authorization,
    })

    api.use(validateToken)

    api.get('/user', getUser(database, client))
    api.get('/group/purchases', getPurchases(database))
    api.post('/group/purchases', postPurchase(database))
    api.get('/group/items', getItems(database))
    api.post('/group/items', postItem(database))
    api.get('/group/items/:id', getItem(database))
    api.put('/group/items/:id', putItem(database))
    api.delete('/group/item/:id', deleteItem(database))

    api.get('/test', (req, res) => {
        res.end('Hello world')
    })

    return api
}
export default createApiRouter
