import { JourneyType } from 'types/journey';
import { myerror, fetcher, myinfo } from '../utils'
import download from 'downloadjs'

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
