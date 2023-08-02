import { createContext } from "react";
import { NodeType, TaskResponseType } from "../types/node";
import { BasePlayerStateProps } from "players/base";

export type NodeContextType = {
  node: NodeType;
  response?: TaskResponseType;
  player?: BasePlayerStateProps;
};

export const nodeContext = createContext<NodeContextType>({
  node: null,
  response: null,
});
