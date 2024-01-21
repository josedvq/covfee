import * as React from "react"

import { JourneyType as FullJourney } from "../types/journey"
import { JourneyType as ReducedJourney } from "../types/hit"
import { myerror, fetcher, myinfo, throwBadResponse } from "../utils"
import download from "downloadjs"
import Constants from "Constants"

type JourneyType = FullJourney | ReducedJourney

export type { JourneyType, FullJourney, ReducedJourney }

export const useJourneyFns = <T extends JourneyType>(journey: T) => {
  const getApiUrl = () => {
    const url = Constants.api_url + "/journeys/" + journey.id
    return url
  }
  return {
    getApiUrl,
    getUrl: () => {
      return Constants.app_url + "/journeys/" + journey.id
    },

    getDownloadHandler: (csv: boolean) => {
      const request_url = getApiUrl() + "/download" + (csv ? "?csv=1" : "")
      return () => {
        fetcher(request_url)
          .then(async (response: any) => {
            if (!response.ok) {
              const data = await response.json()
              if (data.hasOwnProperty("msg")) {
                throw Error(data.msg)
              }
              throw Error(response.statusText)
            }
            return response
          })
          .then(async (response: any) => {
            if (response.status == 204) {
              return myinfo("Nothing to download.")
            }
            const blob = await response.blob()
            download(blob)
          })
          .catch((error) => {
            myerror("Error fetching task response.", error)
          })
      }
    },
  }
}

export const useJourney = <T extends JourneyType>(data: T) => {
  const [journey, setJourney] = React.useState<T>(data)

  const journeyFns = useJourneyFns(journey)

  return {
    journey,
    setJourney,
    ...journeyFns,
  }
}

export const fetchJourney = (id: string) => {
  const url =
    Constants.api_url +
    "/journeys/" +
    id +
    "?" +
    new URLSearchParams({
      with_nodes: "1",
    })

  return fetcher(url).then(throwBadResponse)
}

export const submitJourney = (id: string) => {
  const url = Constants.api_url + "/journeys/" + id + "/submit"
  // submit HIT to get completion code
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ success: true }),
  }
  return fetcher(url, requestOptions).then(throwBadResponse)
}
