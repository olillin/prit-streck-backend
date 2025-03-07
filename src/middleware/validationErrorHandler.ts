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
    if (error.type === 'field') {
        console.log(error)
        sendError(res, errors.invalidProperty(error.path))
        return
    } else if (error.type === 'alternative_grouped') {
        console.log(error)
        sendError(res, errors.invalidProperty(error.nestedErrors[0][0].path))
        return
    } else if (error.type === 'alternative') {
        console.log(error)
        sendError(res, errors.invalidProperty(error.nestedErrors[0].path))
        return
    }

    const message = `Illegal validation error type '${error.type}': ${JSON.stringify(error)}`
    console.error(message)
    sendError(res, errors.unexpected(message))
    return
}
export default validationErrorHandler
