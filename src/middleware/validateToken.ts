import { Request, Response, NextFunction } from 'express'
import { errors, sendError } from '../errors'
import jwt from 'jsonwebtoken'
import env from '../config/env'
import { LocalJwt } from '../types'
import { UserId } from 'gammait'

function validateToken(req: Request, res: Response, next: NextFunction) {
    console.log(`${req.method} to API: ${req.path}`)

    const auth = req.headers.authorization
    if (!auth) {
        sendError(res, errors.unauthorized)
        return
    }
    const token = auth.split(' ')[1]
    try {
        const verifiedToken = verifyToken(token)

        if (verifiedToken.exp) {
            const isExpired = Date.now() >= verifiedToken.exp * 1000
            if (isExpired) {
                sendError(res, errors.expiredToken)
                return
            }
        }
        if (verifiedToken.nbf) {
            const isBefore = Date.now() < verifiedToken.nbf * 1000
            if (isBefore) {
                sendError(res, errors.nbf)
                return
            }
        }

        if (!verifiedToken.userId || !verifiedToken.groupId) {
            sendError(res, errors.invalidToken)
            return
        }

        console.log('Verified token:')
        console.log(verifiedToken)

        // Store token
        res.locals.jwt = verifiedToken
        next()
    } catch {
        sendError(res, errors.unauthorized)
    }
}
export default validateToken

export function verifyToken(token: string): LocalJwt {
    return jwt.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: env.JWT_ISSUER,
    }) as LocalJwt
}

export function getUserId(res: Response): UserId {
    const jwt: LocalJwt = res.locals.jwt
    return jwt.userId
}

export function getGroupId(res: Response): UserId {
    const jwt: LocalJwt = res.locals.jwt
    return jwt.groupId
}
