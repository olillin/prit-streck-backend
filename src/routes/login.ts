import { Request, Response } from 'express'
import { GroupId, UserId } from 'gammait'
import jwt from 'jsonwebtoken'
import { authorizationCode, clientApi, database } from '../config/clients'
import env from '../config/env'
import { errors, sendError } from '../errors'
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
        // Validate request
        const code = req.query.code as string | undefined
        if (!code) {
            sendError(res, errors.noCode)
            return
        }

        // Get clients
        const db = await database()

        try {
            await authorizationCode.generateToken(code)
        } catch (error) {
            sendError(res, 500, 'Failed to generate token: ' + String(error))
            return
        }

        const userInfo = await authorizationCode.userInfo()
        const id: UserId = userInfo.sub
        const groups = await clientApi.getGroupsFor(id)
        const group = getAuthorizedGroup(groups)
        if (!group) {
            // User is not in the super group
            sendError(res, errors.noPermission)
            return
        }

        const userExists = await db.userExists(id)
        if (!userExists) {
            const groupExists = await db.groupExists(group.id)
            if (!groupExists) {
                await db.createGroup(group.id)
            }
            await db.createUser(id)
        }
        const dbUser = (await db.getUser(id))!

        signJWT({
            userId: id,
            groupId: group.id,
        })
            .then(token => {
                const data = convert.toLoginResponse(dbUser, userInfo, group, token)
                const body: ResponseBody<LoginResponse> = { data }
                res.json(body)
            })
            .catch(error => {
                sendError(res, 500, 'Failed to sign token: ' + String(error))
            })
    }
}
