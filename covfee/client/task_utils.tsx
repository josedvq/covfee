import CovfeeTasks from './tasks'
import CustomTasks from 'CustomTasks'


const getTaskClass = (type: string) => {
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

export { 
    getTaskClass, 
}