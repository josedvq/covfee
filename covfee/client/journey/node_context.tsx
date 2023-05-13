import { createContext } from 'react';
import { NodeType, TaskResponseType } from '../types/node';

export type NodeContextType = {
    node: NodeType,
    response?: TaskResponseType
}

export const NodeContext = createContext<NodeContextType>({
    node: null,
    response: null
});