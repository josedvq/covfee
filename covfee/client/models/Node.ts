import * as React from "react";
import { NodeStatus, NodeType, TaskResponseType } from "../types/node";
import { fetcher, throwBadResponse } from "../utils";
import { MainSocket } from "../app_context";

export function useNode(data: NodeType, socket: MainSocket = null) {
  const [node, setNode] = React.useState<NodeType>(data);
  const [response, setResponse] = React.useState<TaskResponseType>(null);

  const getUrl = () => {
    return "TODO";
  };

  const setStatus = (status: NodeStatus) => {
    setNode({
      ...node,
      status: status,
    });
  };

  React.useEffect(() => {
    if (socket) {
      socket.on("status", (data) => {
        console.log(["status", data]);
        setNode({
          ...node,
          status: data.new,
          curr_journeys: data.curr_journeys,
        });
      });
    }
    return () => {
      socket.removeAllListeners("status");
    };
  }, [socket]);

  const fetchResponse = () => {
    const url = node.url + "/response?" + new URLSearchParams({});
    const p = fetcher(url).then(throwBadResponse);
    p.then((r) => {
      setResponse(r);
    });
    return p;
  };

  const submitResponse = (data: any) => {
    const url = response.url + "/submit?" + new URLSearchParams({});

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };

    // now send the task results
    return fetcher(url, requestOptions).then(throwBadResponse);
  };

  const makeResponse = (response: TaskResponseType, data: any) => {
    const url = node.url + "/make_response?" + new URLSearchParams({});

    const requestOptions = {
      method: "POST",
    };

    return fetcher(url, requestOptions).then(throwBadResponse);
  };

  return {
    node,
    setNode,
    getUrl,
    response,
    setStatus,
    fetchResponse,
    submitResponse,
    makeResponse,
  };
}
