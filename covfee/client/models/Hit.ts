import React, { useState } from "react";
import { HitInstanceType } from "../types/hit";
import { fetcher, throwBadResponse } from "../utils";
import Constants from "Constants";
import { MainSocket, ServerToClientEvents } from "../app_context";
import { JourneyType } from "./Journey";

export const useHitInstance = (
  data: HitInstanceType,
  socket: MainSocket = null
) => {
  const [hitData, setHitData] = useState(data);

  const journeyIdToIndex = Object.fromEntries(
    data.journeys.map((j, i) => [j.id, i])
  );

  const nodeIdToIndex = Object.fromEntries(
    data.nodes.map((node, i) => [node.id, i])
  );

  React.useEffect(() => {
    const statusListener: ServerToClientEvents["status"] = (data) => {
      const nodeIds = hitData.nodes.map((n) => n.id);
      if (!nodeIds.includes(data.id)) return;
      const nodeIndex = nodeIdToIndex[data.id];
      const newNodes = Object.assign([], hitData.nodes, {
        [nodeIndex]: {
          ...hitData.nodes[nodeIndex],
          status: data.new,
          curr_journeys: data.curr_journeys,
        },
      });

      setHitData({
        ...hitData,
        nodes: newNodes,
      });
    };

    const setJourneyData = (journeyId: string, data: Partial<JourneyType>) => {
      const journeyIds = Object.keys(journeyIdToIndex);
      if (!journeyIds.includes(journeyId)) return;
      const journeyIndex = journeyIdToIndex[journeyId];
      const newJourneys = Object.assign([], hitData.journeys, {
        [journeyIndex]: {
          ...hitData.journeys[journeyIndex],
          ...data,
        },
      });
      setHitData({
        ...hitData,
        journeys: newJourneys,
      });
    };

    const journeyConnectListener: ServerToClientEvents["journey_connect"] = ({
      journey_id,
      num_connections,
    }) => {
      console.log("journey_connect");
      setJourneyData(journey_id, { num_connections });
    };

    const journeyDisconnectListener: ServerToClientEvents["journey_disconnect"] =
      ({ journey_id, num_connections }) => {
        console.log(["journey_disconnect", num_connections]);
        setJourneyData(journey_id, { num_connections });
      };

    if (socket) {
      socket.on("status", statusListener);
      socket.on("journey_connect", journeyConnectListener);
      socket.on("journey_disconnect", journeyDisconnectListener);
    }
    return () => {
      socket.removeListener("status", statusListener);
      socket.removeListener("journey_connect", journeyConnectListener);
      socket.removeListener("journey_disconnect", journeyDisconnectListener);
    };
  }, [socket, hitData]);

  React.useEffect(() => {
    console.log(hitData);
  }, [hitData]);

  const setCollapsed = async (value: boolean) => {
    return update({ collapsed: value });
  };

  const setShowGraph = async (value: boolean) => {
    return update({ show_graph: value });
  };

  const setShowJourneys = async (value: boolean) => {
    return update({ show_journeys: value });
  };

  const setShowNodes = async (value: boolean) => {
    return update({ show_nodes: value });
  };

  const update = async (hit: Partial<HitInstanceType>) => {
    const url = hitData.api_url + "/edit?" + new URLSearchParams({});

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hit),
    };

    return fetcher(url, requestOptions)
      .then(throwBadResponse)
      .then((res) => {
        setHitData((curr) => ({
          ...curr,
          ...res,
        }));
      });
  };

  return {
    hitInstance: hitData,
    update,
    setCollapsed,
    setShowGraph,
    setShowJourneys,
    setShowNodes,
  };
};

export function getHit(id: number) {
  const url =
    Constants.api_url +
    "/hits/" +
    id +
    "?" +
    new URLSearchParams({
      with_instances: "1",
      with_instance_nodes: "1",
    });

  fetcher(url).then(throwBadResponse);
}

export function getHitInstance(id: string) {
  const url =
    Constants.api_url +
    "/instances/" +
    id +
    "?" +
    new URLSearchParams({
      with_nodes: "1",
    });

  return fetcher(url).then(throwBadResponse);
}
