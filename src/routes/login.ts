import { Request, Response } from 'express'
import { GroupId, UserId } from 'gammait'
import jwt from 'jsonwebtoken'
import { authorizationCode, clientApi, database } from '../config/clients'
import env from '../config/env'
import { ApiError, sendError, tokenSignError, unexpectedError } from '../errors'
import { JWT, LoginResponse, ResponseBody } from '../types'
import * as convert from '../util/convert'
import { getAuthorizedGroup } from '../util/getter'

interface LoggedInUser {
    userId: UserId
    groupId: GroupId
}

function signJWT(user: LoggedInUser): Promise<JWT> {
    return new Promise((resolve, reject) => {
        const expireMinutes = parseFloat(env.JWT_EXPIRE_MINUTES)
        const expireSeconds = expireMinutes * 60 * 1000

        console.log(`Attempting to sign token for ${user.userId}`)

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
                    else if (token) resolve({ token, expireMinutes })
                }
            )
        } catch (error) {
            reject(error)
        }
    })
}

export function login(): (req: Request, res: Response) => void {
    return async (req: Request, res: Response) => {
        try {
            // Validate request
            const code = req.query.code as string

            // Get token from Gamma
            try {
                await authorizationCode.generateToken(code)
            } catch (error) {
                if (
                    (error as NodeJS.ErrnoException).code === 'ENOTFOUND' ||
                    (error as NodeJS.ErrnoException).code === 'ECONNREFUSED'
                ) {
                    sendError(res, ApiError.UnreachableGamma)
                } else if (error instanceof Error) {
                    sendError(res, ApiError.InvalidAuthorizationCode)
                } else {
                    sendError(res, ApiError.GammaToken)
                }
                return
            }

            const db = await database()
            const userInfo = await authorizationCode.userInfo()
            const id: UserId = userInfo.sub
            const groups = await clientApi.getGroupsFor(id)
            const group = getAuthorizedGroup(groups)
            if (!group) {
                // User is not in the super group
                sendError(res, ApiError.NoPermission)
                return
            }

            const userExists = await db.userExists(id)
            if (!userExists) {
                const groupExists = await db.groupExists(group.id)
                if (!groupExists) {
                    await db.createGroup(group.id)
                }
                await db.createUser(id, group.id)
            }
            const dbUser = (await db.getUser(id))!

            signJWT({
                userId: id,
                groupId: group.id,
            })
                .then(token => {
                    const data = convert.toLoginResponse(
                        dbUser,
                        userInfo,
                        group,
                        token
                    )
                    const body: ResponseBody<LoginResponse> = { data }
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
