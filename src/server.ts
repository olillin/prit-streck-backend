import express, { NextFunction, Request, Response } from 'express'
import rateLimit from 'express-rate-limit'
import { authorizationCode } from './config/clients'
import env from './config/env'
import { sendError, unexpectedError } from './errors'
import createApiRouter from './routers/api'
import { login as loginRoute } from './routes/login'
import * as validate from './middleware/validators'
import validationErrorHandler from './middleware/validationErrorHandler'

async function main() {
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

    app.post('/login', validate.login(), validationErrorHandler, loginRoute())

    app.use(express.json())
    const api = await createApiRouter()
    app.use('/api', api)

    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error(err)
        console.trace(err)
        sendError(res, unexpectedError(err.message))
    })

    app.listen(parseInt(env.PORT))
    console.log(`Listening on port ${env.PORT}`)
}
main()
