import { JourneyType } from 'types/journey';
import { myerror, fetcher, myinfo, throwBadResponse } from '../utils'
import download from 'downloadjs'
import Constants from 'Constants'

export class Journey {

    spec: JourneyType;
    
    constructor(spec: JourneyType) {
      this.spec = spec;
    }

    getDownloadHandler = (url: string, csv: boolean) => {
        const request_url = url + '/download' + (csv ? '?csv=1' : '')
        return () => {
            fetcher(request_url).then(async (response: any) => {
                if (!response.ok) {
                    const data = await response.json()
                    if (data.hasOwnProperty('msg')) {
                        throw Error(data.msg)
                    }
                    throw Error(response.statusText)
                }
                return response
            }).then(async (response: any) => {
                if (response.status == 204) {
                    return myinfo('Nothing to download.')
                }
                const blob = await response.blob()
                download(blob)
            }).catch(error => {
                myerror('Error fetching task response.', error)
            })
        }
    }
    
}

export const fetchJourney = (id: string) => {
    const url = Constants.api_url + '/journeys/' + id + '?' + new URLSearchParams({
        with_nodes: '1',
    })

    return fetcher(url)
        .then(throwBadResponse)
}

export const submitJourney = (id: string) => {
    const url = Constants.api_url + '/journeys/' + id + '/submit'
    // submit HIT to get completion code
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'success': true })
    }
    return fetcher(url, requestOptions)
        .then(throwBadResponse)
}