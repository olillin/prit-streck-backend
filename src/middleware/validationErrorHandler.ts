import { NextFunction, Request, Response } from 'express'
import { validationResult } from 'express-validator'
import { errors, sendError } from '../errors'

async function validationErrorHandler(req: Request, res: Response, next: NextFunction) {
    const result = validationResult(req)
    if (result.isEmpty()) {
        next()
        return
    }

    const error = result.array()[0]
    if (error.type !== 'field') {
        console.error(`Illegal validation error type '${error.type}': ${JSON.stringify(error)}`)
        sendError(res, errors.unexpected)
        return
    }

    console.log(error)

    sendError(res, errors.invalidProperty(error.path))
}
export default validationErrorHandler
