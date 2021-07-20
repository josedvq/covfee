import CovfeeTasks from './tasks'
import CovfeePlayers from './players'


export const getTask = (type: string) => {
    if (type in CovfeeTasks) {
        const taskImport = CovfeeTasks[type]
        if(typeof taskImport === 'object' && 'taskConstructor' in taskImport && 'taskReducer' in taskImport) {
            return taskImport
        } else {
            return {taskConstructor: taskImport, taskReducer: null}
        }
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
