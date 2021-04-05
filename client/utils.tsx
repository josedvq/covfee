import {message} from 'antd'

import Constants from 'Constants'

// read a cookie in the browser
export function getCookieValue(a: string) {
    var b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)')
    return b ? b.pop() : null
}

export function getUrlQueryParam(name: string) {
    // querystring is after the hash
    let search
    if (window.location.hash.indexOf('?') !== -1) {
        search = '?' + window.location.hash.split('?')[1]
    } else {
        search = window.location.search
    }
    const params = new URLSearchParams(search);
    return params.get(name)
}

// error method that
//   prints an message to screen in production environment
//   prints and logs a detailed error in dev mode
export function myerror(msg: string, error?: any) {
    if(Constants.env == 'production') {
        message.error(msg + ' Please try again later or contact the organizer(s).')
    } else {
        if(error) {
            console.error(error)
            message.error(error.stack, 0)
        }
    }
}

export function myinfo(msg: string) {
    message.info(msg)
}

// fetch wrapper that appends the csrf_access_token cookie for authentication
export function fetcher(input: RequestInfo, options?: RequestInit) {
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

// fetch then function that throws an error for error status codes
export const throwBadResponse = async (response: any) => {
    if (!response.ok) {
        const data = await response.json()
        if(data.hasOwnProperty('msg')) {
            throw Error(data.msg)
        }
        throw Error(response.statusText)
    }
    return await response.json()
}

export function getFullscreen(element: HTMLElement) {
    if (element.requestFullscreen) {
        return element.requestFullscreen()
    } else if (element.mozRequestFullScreen) {
        return element.mozRequestFullScreen()
    } else if (element.webkitRequestFullscreen) {
        return element.webkitRequestFullscreen()
    } else if (element.msRequestFullscreen) {
        return element.msRequestFullscreen()
    }
}

export function closeFullscreen() {
    if (document.exitFullscreen) {
        return document.exitFullscreen()
    } else if (document.mozCancelFullScreen) { /* Firefox */
        return document.mozCancelFullScreen()
    } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
        return document.webkitExitFullscreen()
    } else if (document.msExitFullscreen) { /* IE/Edge */
        return document.msExitFullscreen()
    }
}
