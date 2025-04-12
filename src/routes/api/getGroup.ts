import {NextFunction, Request, Response} from "express";
import {clientApi, database} from "../../config/clients";
import {UserId} from "gammait";
import {getGroupId, getGammaUserId} from "../../middleware/validateToken";
import {ApiError, sendError} from "../../errors";
import * as convert from "../../util/convert";
import {GroupResponse, ResponseBody, User} from "../../types";
import * as tableType from "../../database/types";
import {getAuthorizedGroup} from "../../util/getter";

export default async function getGroup(req: Request, res: Response, next: NextFunction) {
    try {
        const gammaUserId: UserId = getGammaUserId(res)
        const groupId = getGroupId(res)

        // Get group
        const gammaGroups = await clientApi.getGroupsFor(gammaUserId)
        const gammaGroup = getAuthorizedGroup(gammaGroups)
        if (!gammaGroup) {
            sendError(res, ApiError.NoPermission)
            return
        }

        // Get members
        const fullUsersInGroup = await database.getFullUsersInGroup(groupId)
        let userPromises: Promise<User|null>[]
        try {
            userPromises = fullUsersInGroup.map(async dbUser => {
                const gammaUser = await clientApi.getUser(dbUser.gamma_id)
                    .catch(() => null)
                if (!gammaUser) {
                    console.warn(`Failed to get user ${dbUser.gamma_id} in group ${dbUser.group_gamma_id}`)
                    return null
                }
                return convert.toUser(dbUser, gammaUser)
            })
        } catch (e) {
            const message = `Failed to get users from gamma: ${e}`
            console.error(message)
            sendError(res, ApiError.InvalidGammaResponse)
            return
        }
        const members = (await Promise.all(userPromises)).filter(user => user !== null)

        const dbGroup: tableType.Groups = {
            id: fullUsersInGroup[0].group_id,
            gamma_id: fullUsersInGroup[0].group_gamma_id,
        }
        const group = convert.toGroup(dbGroup, gammaGroup)
        const body: ResponseBody<GroupResponse> = { data: { group, members } }
        res.json(body)
    } catch (error) {
        next(error)
    }
}