import * as React from 'react'
import log from 'loglevel'
import {message, Result} from 'antd'

import Constants from 'Constants'
if(Constants.env == 'development') {
    log.setLevel('debug')
} else {
    log.setLevel('error')
}
export {log}

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
            log.error(error)
            message.error(error.stack, 0)
        }
    }
}

export function myinfo(msg: string) {
    message.info(msg)
}

export function urlReplacer(url: string) {
    return url.replace(/\$\$www\$\$/g, Constants.www_url)
}

// fetch wrapper that appends the csrf_access_token cookie for authentication
export function fetcher(input: RequestInfo, options?: RequestInit) {
    if (typeof input == 'string') input = urlReplacer(input)
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

// returns a cancellable promise for use in react components
export type CancelablePromise<T> = {
    promise: Promise<T>
    cancel: ()=>void
}
export const makeCancelablePromise = (promise: Promise<any>) => {
    let hasCanceled_ = false
  
    const wrappedPromise = new Promise((resolve, reject) => {
      promise.then(
        val => hasCanceled_ ? reject({isCanceled: true}) : resolve(val),
        error => hasCanceled_ ? reject({isCanceled: true}) : reject(error)
      )
    })

    return {
      promise: wrappedPromise,
      cancel() {
        hasCanceled_ = true
      }
    } as CancelablePromise<any>
  }

export function getFullscreen(element: any) {
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
    const doc = document as any
    if (doc.exitFullscreen) {
        return doc.exitFullscreen()
    } else if (doc.mozCancelFullScreen) { /* Firefox */
        return doc.mozCancelFullScreen()
    } else if (doc.webkitExitFullscreen) { /* Chrome, Safari and Opera */
        return doc.webkitExitFullscreen()
    } else if (doc.msExitFullscreen) { /* IE/Edge */
        return doc.msExitFullscreen()
    }
}

/**
 * Component that displays an error page's content (without header)
 */
export function ErrorPage() {
    return <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist. If you were given a link to a study or annotation HIT, please contact the organizers."/>
}