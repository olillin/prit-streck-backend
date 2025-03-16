import {Request, Response} from "express";
import {clientApi, database} from "../../config/clients";
import {GroupId, UserId} from "gammait";
import {getGroupId, getUserId} from "../../middleware/validateToken";
import {getAuthorizedGroup} from "../../util/getter";
import {ApiError, sendError} from "../../errors";
import * as convert from "../../util/convert";
import {GroupResponse, ResponseBody, User} from "../../types";

export default async function getGroup(req: Request, res: Response) {
    const db = await database()

    const userId: UserId = getUserId(res)
    const groupId: GroupId = getGroupId(res)

    // Get group
    const gammagroups = await clientApi.getGroupsFor(userId)
    const gammaGroup = getAuthorizedGroup(gammagroups)
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
}