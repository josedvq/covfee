import { TaskResponse } from "../types/node"
import { fetcher, throwBadResponse } from "../utils"

export const handleResponseSubmit = (response: TaskResponse, data: any) => {
    const url = response.url + '/submit?' + new URLSearchParams({
    })

    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }

    // now send the task results
    return fetcher(url, requestOptions)
        .then(throwBadResponse)   
}