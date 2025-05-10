import {GroupWithPost} from 'gammait'
import environment from '../config/env'

export function getAuthorizedGroup(groups: GroupWithPost[]): GroupWithPost | undefined {
    return groups.find(group => group.superGroup.id === environment.SUPER_GROUP_ID)
}
