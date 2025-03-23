import {NextFunction, Request, Response} from "express";
import {clientApi, database} from "../../config/clients";
import {GroupId, UserId} from "gammait";
import {getGroupId, getGammaUserId, getUserId} from "../../middleware/validateToken";
import {getAuthorizedGroup} from "../../util/getter";
import {ApiError, sendError} from "../../errors";
import * as convert from "../../util/convert";
import {GroupResponse, ResponseBody, User} from "../../types";

export default async function getGroup(req: Request, res: Response, next: NextFunction) {
    try {
        const db = await database()

        const userGammaId: UserId = getGammaUserId(res)
        const groupId = getGroupId(res)

        // Get group
        const gammaGroups = await clientApi.getGroupsFor(userGammaId)
        const gammaGroup = getAuthorizedGroup(gammaGroups)
        if (!gammaGroup) {
            sendError(res, ApiError.NoPermission)
            return
        }
        const group = convert.toGroup(gammaGroup)

        // Get members
        let userPromises: Promise<User>[]
        try {
            userPromises = (await db.getUsersInGroup(groupId)).map(async dbUser => {
                const gammaUser = await clientApi.getUser(dbUser.gammaid)
                return convert.toUser(dbUser, gammaUser)
            })
        } catch (e) {
            const message = `Failed to get users from gamma: ${e}`
            console.error(message)
            sendError(res, ApiError.InvalidGammaResponse)
            return
        }
        const members = await Promise.all(userPromises)

        const body: ResponseBody<GroupResponse> = { data: { group, members } }
        res.json(body)
    } catch (error) {
        next(error)
    }
}