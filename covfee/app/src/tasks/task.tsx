import * as React from 'react'

interface TaskSpec {
    type: string,
    hit_id: string,
    id: string,
    name: string,
    numSubmissions: number,
    props: any,
    response: any,
}

export { TaskSpec}
