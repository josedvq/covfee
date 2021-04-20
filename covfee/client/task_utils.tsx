import CovfeeTasks from './tasks'
import CustomTasks from 'CustomTasks'
import CovfeePlayers, { PlayerProps } from './players'


export const getTaskClass = (type: string) => {
    if (type in CovfeeTasks) {
        const taskClass = CovfeeTasks[type]
        return taskClass
    } else if (type in CustomTasks) {

        const taskClass = CustomTasks[type]
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
