import { createContext } from "react";
import { NodeType, TaskResponseType } from "../types/node";
import { BasePlayerStateProps } from "players/base";

export type NodeContextType = {
  node: NodeType;
  useSharedState: boolean;
  response?: TaskResponseType;
  player?: BasePlayerStateProps;
};

export const nodeContext = createContext<NodeContextType>({
  node: null,
  useSharedState: false,
  response: null,
});
