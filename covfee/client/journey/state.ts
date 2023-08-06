import { Store, Slice, configureStore, Action } from "@reduxjs/toolkit";
import React, { useState, useRef, useEffect, useContext } from "react";

import { nodeContext } from "./node_context";
import { useDispatch } from "react-redux";
import { appContext } from "../app_context";

export const useNodeState = <T>(slice: Slice) => {
  const { response, useSharedState } = useContext(nodeContext);
  const { socket } = useContext(appContext);

  const reduxDispatch = useDispatch();

  const dispatch = (action: Action) => {
    if (useSharedState)
      socket.emit("action", { responseId: response.id, action });
    else reduxDispatch(action);
  };

  React.useEffect(() => {
    if (socket) {
      socket.on("action", (action) => {
        reduxDispatch(action);
      });

      socket.on("state", (state) => {
        const action = { type: `${slice.name}/setState`, payload: state.state };
        console.log(action);
        reduxDispatch(action);
      });
    }
  }, [socket]);

  return {
    dispatch,
  };
};
