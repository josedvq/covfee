import * as React from "react"

import Constants from "Constants"
import download from "downloadjs"
import { useEffect } from "react"
import { MainSocket, ServerToClientEvents } from "../app_context"
import { JourneyType as ReducedJourney } from "../types/hit"
import { JourneyType as FullJourney } from "../types/journey"
import { fetcher, myerror, myinfo, throwBadResponse } from "../utils"

type JourneyType = FullJourney | ReducedJourney

export type { FullJourney, JourneyType, ReducedJourney }

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
    disable: () => {
      const journeyUrl = Constants.api_url + "/journeys/" + journey.id
      const url = journeyUrl + "/disable"
      return fetcher(url).then(throwBadResponse)
    },
    submit: () => {
      const journeyUrl = Constants.api_url + "/journeys/" + journey.id
      const url = journeyUrl + "/submit"

      return fetcher(url).then(throwBadResponse)
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

export const useJourney = <T extends JourneyType>(
  data: T,
  socket: MainSocket = null
) => {
  const [journey, setJourney] = React.useState<T>(data)

  const journeyFns = useJourneyFns(journey)

  const submit = React.useCallback(async () => {
    await journeyFns.submit()
  }, [])

  useEffect(() => {
    const handleStatus: ServerToClientEvents["journey_status"] = (data) => {
      console.log("IO: journey_status", data)
      if (data.journey_id !== journey.id) return

      setJourney((journey) => ({
        ...journey,
        ...data,
      }))
    }

    if (socket) {
      socket.on("journey_status", handleStatus)
      return () => {
        socket.off("journey_status", handleStatus)
      }
    }
  }, [journey.id, socket])

  return {
    journey,
    setJourney,
    ...journeyFns,
    submit,
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
