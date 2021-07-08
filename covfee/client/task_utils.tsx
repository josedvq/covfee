import CovfeeTasks from './tasks'
import CovfeePlayers, { PlayerProps } from './players'


export const getTaskClass = (type: string) => {
    if (type in CovfeeTasks) {
        const taskClass = CovfeeTasks[type]
        return taskClass
    } else {
        return null
    }
}

export const getPlayerClass = (type: string) => {
    if (type in CovfeePlayers) {
        const taskClass = CovfeePlayers[type]
        return taskClass
    } else {
        return null
    }
}
