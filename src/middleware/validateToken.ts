import { Request, Response, NextFunction } from 'express'
import { errors, sendError } from '../errors'
import jwt, { JwtPayload } from 'jsonwebtoken'
import env from '../config/env'
import { LocalJwt } from '../types'
import { UserId } from 'gammait'

function validateToken(req: Request, res: Response, next: NextFunction) {
    console.log(`${req.method} to API: ${req.path}`)

    const auth = req.headers.authorization
    if (!auth) {
        errors.unauthorized
        sendError(res, errors.unauthorized)
        return
    }
    const token = auth.split(' ')[1]

    const verified = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: env.JWT_ISSUER,
    }) as JwtPayload
    console.log('Verified token:')
    console.log(verified)

    res.locals.jwt = verified

    next()
}
export default validateToken

export function getUserId(res: Response): UserId {
    const jwt: LocalJwt = res.locals.jwt
    return jwt.userId
}

export function getGroupId(res: Response): UserId {
    const jwt: LocalJwt = res.locals.jwt
    return jwt.groupId
}
