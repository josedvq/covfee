import * as Tasks from './tasks'
import * as CustomTasks from 'CustomTasks'

const getTaskClass = (type: string) => {
    if (Tasks.hasOwnProperty(type)) {
        const taskClass = Tasks[type]
        return taskClass
    } else if (CustomTasks.hasOwnProperty(type)) {
        const taskClass = CustomTasks[type]
        return taskClass
    } else {
        return null
    }
}

export { getTaskClass}