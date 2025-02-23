import { NextFunction, Request, Response } from 'express'
import { AuthorizationCode, ClientApi, GroupId, UserId } from 'gammait'
import { groupAvatarUrl, userAvatarUrl } from 'gammait/urls'
import jwt from 'jsonwebtoken'
import env from '../config/env'
import DatabaseClient from '../database/client'
import { errors, sendError } from '../errors'
import { JWT, LoginResponse, ResponseBody } from '../types'

export interface LoggedInUser {
    userId: UserId
    groupId: GroupId
}

function signJWT(user: LoggedInUser): Promise<JWT> {
    return new Promise((resolve, reject) => {
        let expireMinutes = parseFloat(env.JWT_EXPIRE_MINUTES)
        let expireSeconds = expireMinutes * 60 * 1000

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

export function login(authorizationCode: AuthorizationCode, client: ClientApi, database: DatabaseClient): (req: Request, res: Response, next: NextFunction) => void {
    return async (req: Request, res: Response, next: NextFunction) => {
        const code = req.query.code as string | undefined
        if (!code) {
            sendError(res, errors.noCode)
            return
        }

        try {
            await authorizationCode.generateToken(code)
        } catch (error) {
            sendError(res, 500, 'Failed to generate token: ' + String(error))
            return
        }

        const userInfo = await authorizationCode.userInfo()
        const id: UserId = userInfo.sub
        const groups = await client.getGroupsFor(id)
        const group = groups.find(group => group.superGroup.id == env.SUPER_GROUP_ID)
        if (!group) {
            // User is not in the super group
            sendError(res, errors.noPermission)
            return
        }

        const userExists = await database.userExists(id)
        console.log(`User ${id} exists:`)
        console.log(userExists)
        if (!userExists) {
            const groupExists = await database.groupExists(group.id)
            console.log(`Group ${group.id} exists:`)
            console.log(groupExists)
            if (!groupExists) {
                await database.createGroup(group.id)
            }
            await database.createUser(id, group.id)
        }
        const dbUser = (await database.getUser(id))!

        signJWT({
            userId: id,
            groupId: group.id,
        })
            .then(token => {
                let data: LoginResponse = {
                    user: {
                        id: id,
                        firstName: userInfo.given_name,
                        lastName: userInfo.family_name,
                        nick: userInfo.nickname,
                        avatarUrl: userAvatarUrl(id),

                        balance: dbUser.balance,

                        group: {
                            id: group.id,
                            prettyName: group.prettyName,
                            avatarUrl: groupAvatarUrl(group.id),
                        },
                    },
                    token: token,
                }
                let body: ResponseBody = { data }
                res.json(body)
            })
            .catch(error => {
                sendError(res, 500, 'Failed to sign token: ' + String(error))
            })
    }
}
