import { Store, Slice, configureStore, Action } from "@reduxjs/toolkit";
import React, { useState, useRef, useEffect, useContext } from "react";
import { io } from "socket.io-client";
import { NodeContext } from "./node_context";
import { useDispatch } from "react-redux";

export const useNodeState = <T>(slice: Slice) => {
  const nodeContext = useContext(NodeContext);
  const reduxDispatch = useDispatch();
  // const [state, setState] = useState<T>(slice.getInitialState());

  const socket = io();

  useEffect(() => {
    if (nodeContext.response) {
      socket.emit("join", { responseId: nodeContext.response.id });
    }
  }, [nodeContext.response]);

  const dispatch = (action: Action) => {
    socket.emit("action", { responseId: nodeContext.response.id, action });
  };

  socket.on("action", (action) => {
    console.log(action);
    reduxDispatch(action);
  });

  socket.on("state", (state) => {
    const action = { type: `${slice.name}/setState`, payload: state.state };
    console.log(action);
    reduxDispatch(action);
  });

  return {
    dispatch,
  };
};
