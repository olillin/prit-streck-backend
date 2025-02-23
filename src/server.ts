import express from 'express'
import rateLimit from 'express-rate-limit'
import { AuthorizationCode, ClientApi } from 'gammait'
import env from './config/env'
import DatabaseClient from './database/client'
import createApiRouter from './routers/api'
import { login as loginRoute } from './routes/login'

async function main() {
    const authorizationCode = new AuthorizationCode({
        clientId: env.GAMMA_CLIENT_ID,
        clientSecret: env.GAMMA_CLIENT_SECRET,
        redirectUri: env.GAMMA_REDIRECT_URI,
        scope: ['openid', 'profile'],
    })
    const client = new ClientApi({
        authorization: env.GAMMA_API_AUTHORIZATION,
    })

    // Connect to database
    const database = new DatabaseClient({
        user: env.PGUSER,
        password: env.PGPASSWORD,
        host: env.PGHOST,
        port: parseInt(env.PGPORT),
        database: env.PGDATABASE,
    })
    await database.connect()

    // Setup server
    const app = express()

    // Rate limit
    const limiter = rateLimit({
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true, // Sends `RateLimit-*` headers
        legacyHeaders: false, // Disable `X-RateLimit-*` headers (deprecated)
    })
    app.use(limiter)

    app.get('/authorize', (req, res) => {
        res.redirect(authorizationCode.authorizeUrl())
    })

    app.post('/login', loginRoute(authorizationCode, client, database))

    const api = createApiRouter(env.GAMMA_API_AUTHORIZATION, database)
    app.use('/api', api)

    app.listen(parseInt(env.PORT))
    console.log(`Listening on port ${env.PORT}`)
}
main()
