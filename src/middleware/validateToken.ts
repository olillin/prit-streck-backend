import { Request, Response, NextFunction } from 'express'
import { ApiError, sendError } from '../errors'
import jwt from 'jsonwebtoken'
import env from '../config/env'
import { LocalJwt } from '../types'
import {GroupId, UserId} from 'gammait'

function validateToken(req: Request, res: Response, next: NextFunction) {
    console.log(`${req.method} to API: ${req.path}`)

    const auth = req.headers.authorization
    if (!auth) {
        sendError(res, ApiError.Unauthorized)
        return
    }
    const token = auth.split(' ')[1]
    try {
        const verifiedToken = verifyToken(token)

        if (verifiedToken.exp) {
            const isExpired = Date.now() >= verifiedToken.exp * 1000
            if (isExpired) {
                sendError(res, ApiError.ExpiredToken)
                return
            }
        }
        if (verifiedToken.nbf) {
            const isBefore = Date.now() < verifiedToken.nbf * 1000
            if (isBefore) {
                sendError(res, ApiError.BeforeNbf)
                return
            }
        }

        if (!verifiedToken.userId || !verifiedToken.groupId) {
            sendError(res, ApiError.InvalidToken)
            return
        }

        console.log('Verified token:')
        console.log(verifiedToken)

        // Store token
        res.locals.jwt = verifiedToken
        next()
    } catch {
        sendError(res, ApiError.Unauthorized)
    }
}
export default validateToken

export function verifyToken(token: string): LocalJwt {
    return jwt.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: env.JWT_ISSUER,
    }) as LocalJwt
}

export function getUserId(res: Response): number {
    const jwt: LocalJwt = res.locals.jwt
    return jwt.userId
}

export function getGammaUserId(res: Response): UserId {
    const jwt: LocalJwt = res.locals.jwt
    return jwt.gammaUserId
}

export function getGroupId(res: Response): number {
    const jwt: LocalJwt = res.locals.jwt
    return jwt.groupId
}

export function getGammaGroupId(res: Response): GroupId {
    const jwt: LocalJwt = res.locals.jwt
    return jwt.gammaGroupId
}
