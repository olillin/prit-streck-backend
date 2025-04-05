import {Request, RequestHandler, Response} from 'express'
import { GroupId, UserId } from 'gammait'
import jwt from 'jsonwebtoken'
import { authorizationCode, clientApi, database } from '../config/clients'
import env from '../config/env'
import {ApiError, sendError, tokenSignError} from '../errors'
import { JWT  } from '../types'
import * as convert from '../util/convert'
import { getAuthorizedGroup } from '../util/getter'

interface LoggedInUser {
    userId: UserId
    groupId: GroupId
}

function signJWT(user: LoggedInUser): Promise<JWT> {
    return new Promise((resolve, reject) => {
        const expireSeconds = parseFloat(env.JWT_EXPIRES_IN)

        console.log(`Signing token for ${user.userId}`)

        try {
            jwt.sign(
                user,
                env.JWT_SECRET,
                {
                    issuer: env.JWT_ISSUER,
                    algorithm: 'HS256',
                    expiresIn: expireSeconds,
                },
                (error, token) => {
                    if (error) reject(error)
                    else if (token)
                        resolve({
                            access_token: token,
                            expires_in: expireSeconds,
                        })
                }
            )
        } catch (error) {
            reject(error)
        }
    })
}

export function login(): RequestHandler {
    return async (req: Request, res: Response) => {
        res.setHeader('Allow', 'POST')
        try {
            // Validate request
            const code = (req.query.code ?? req.body.code) as string

            // Get token from Gamma
            try {
                await authorizationCode.generateToken(code)
            } catch (error) {
                const unreachable = (error as NodeJS.ErrnoException)?.code === 'ENOTFOUND'
                    || (error as NodeJS.ErrnoException)?.code === 'ECONNREFUSED'
                if (unreachable) {
                    sendError(res, ApiError.UnreachableGamma)
                } else {
                    console.error(`Failed to get token from Gamma: ${error}`)
                    if (error instanceof Error && (error as Error).message.includes('400')) {
                        sendError(res, ApiError.AuthorizationCodeUsed)
                    } else {
                        sendError(res, ApiError.GammaToken)
                    }
                }
                return
            }

            const userInfo = await authorizationCode.userInfo()
            const gammaUserId: UserId = userInfo.sub
            const groups = await clientApi.getGroupsFor(gammaUserId)
            const group = getAuthorizedGroup(groups)
            if (!group) {
                // User is not in the super group
                sendError(res, ApiError.NoPermission)
                return
            }
            const gammaGroupId: GroupId = group.id

            const dbUser = await database.softCreateGroupAndUser(gammaGroupId, gammaUserId)

            signJWT({
                userId: gammaUserId,
                groupId: group.id,
            })
                .then(token => {
                    const body = convert.toLoginResponse(
                        dbUser,
                        userInfo,
                        group,
                        token
                    )
                    res.json(body)
                })
                .catch(error => {
                    sendError(res, tokenSignError(String(error)))
                })
        } catch (error) {
            if (
                (error as NodeJS.ErrnoException).code === 'ENOTFOUND' ||
                (error as NodeJS.ErrnoException).code === 'ECONNREFUSED'
            ) {
                sendError(res, ApiError.UnreachableGamma)
            }
        }
    }
}
