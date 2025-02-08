import { Cached } from './cache'

interface SuperGroup {
    id: string
    name: string
    prettyName: string
    type: string
    svDescription: string
    enDescription: string
}

interface Group {
    id: string
    name: string
    prettyName: string
    superGroup: SuperGroup
}

var cachedUrl: Cached<string> | undefined = undefined

export function getCurrentPritIconUrl(authorization: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
        let postResolve = false
        if (cachedUrl) {
            resolve(cachedUrl.value)

            if (!cachedUrl.isExpired()) return

            postResolve = true
        }

        fetch('https://auth.chalmers.it/api/client/v1/groups', {
            headers: {
                Authorization: authorization,
            },
        })
            .then(async groupsResponse => {
                if (!groupsResponse.ok) {
                    reject('Failed to get groups from Gamma')
                    return
                }

                const groups: Group[] = await groupsResponse.json()
                groups.forEach(group => {
                    if (group.superGroup.name === 'prit') {
                        // `group` is the current P.R.I.T. group
                        const url = `https://auth.chalmers.it/images/group/avatar/${group.id}`

                        if (!postResolve) resolve(url)

                        cachedUrl = new Cached(url)
                        return
                    }
                })

                // No P.R.I.T. group found
                reject('Could not find P.R.I.T. group')
            })
            .catch(reason => {
                reject(`Failed to get groups from Gamma: ${reason}`)
            })
    })
}
