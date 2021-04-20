/**
 * Returns a version of fetch with a max timeout.
 * If the timer expires the fetch promise is rejected.
 */
export function getFetchWithTimeout(timeout: number) {
    return async function (resource: RequestInfo, options: RequestInit) {
        const controller = new AbortController()
        const id = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id)

        return response
    }
}


export async function dummyFetch(resource: string, options: any) {
    return Promise.resolve()
}