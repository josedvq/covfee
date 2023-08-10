import * as React from "react";
import { NodeStatus, NodeType, TaskResponseType } from "../types/node";
import { fetcher, throwBadResponse } from "../utils";
import { MainSocket } from "../app_context";

export function useNodeFns(node: NodeType) {
  return {
    getUrl: () => {
      return "TODO";
    },
    fetchResponse: () => {
      const url = node.url + "/response?" + new URLSearchParams({});
      const p = fetcher(url).then(throwBadResponse);
      return p;
    },
    submitResponse: (responseUrl: string, data: any) => {
      const url = responseUrl + "/submit?" + new URLSearchParams({});

      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      };

      // now send the task results
      return fetcher(url, requestOptions).then(throwBadResponse);
    },

    makeResponse: (response: TaskResponseType, data: any) => {
      const url = node.url + "/make_response?" + new URLSearchParams({});

      const requestOptions = {
        method: "POST",
      };

      return fetcher(url, requestOptions).then(throwBadResponse);
    },
  };
}

export function useNode(data: NodeType, socket: MainSocket = null) {
  const [node, setNode] = React.useState<NodeType>(data);
  const [response, setResponse] = React.useState<TaskResponseType>(null);
  const {
    getUrl,
    fetchResponse: fetchResponseFn,
    makeResponse,
    submitResponse: submitResponseFn,
  } = useNodeFns(node);

  const setStatus = (status: NodeStatus) => {
    setNode({
      ...node,
      status: status,
    });
  };

  const fetchResponse = async () => {
    return fetchResponseFn().then((r) => {
      setResponse(r);
    });
  };
  const submitResponse = (data: any) => submitResponseFn(response.url, data);

  React.useEffect(() => {
    if (socket) {
      socket.on("status", (data) => {
        setNode({
          ...node,
          status: data.new,
          curr_journeys: data.curr_journeys,
        });
      });
      return () => {
        socket.removeAllListeners("status");
      };
    }
  }, [node, socket]);

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
