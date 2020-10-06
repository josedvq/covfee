function getCookieValue(a: string) {
    var b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)')
    return b ? b.pop() : null
}

function fetcher(input: RequestInfo, options?: RequestInit) {
    const cookie = getCookieValue('csrf_access_token')
    const newOptions = { ...options}
    if(cookie != null) {
        newOptions.headers = {
            ...newOptions.headers,
            'X-CSRF-TOKEN': cookie
        }
    }
    return fetch(input, newOptions)
}

const throwBadResponse = (response: any) => {
    if (!response.ok) {
        throw Error(response.statusText)
    }
    return response.json()
}

export { fetcher, getCookieValue, throwBadResponse}