import * as React from "react";
import { LoadingOutlined } from "@ant-design/icons";
import { appContext } from "../app_context";
import { NodeType } from "../types/node";
import { NodeLoader } from "../journey/node_loader";
import { useParams } from "react-router-dom";
import { fetchNode } from "../models/Node";

interface Props {}

export const NodePage = (props: Props) => {
  const routeParams = useParams();
  const [node, setNode] = React.useState<NodeType>(null);

  const { clearChats, addChats, clearChatListeners, addChatListeners } =
    React.useContext(appContext);

  React.useEffect(() => {
    fetchNode(parseInt(routeParams.nodeId)).then((n) => {
      setNode(n);
    });
  }, []);

  if (node === null) {
    return (
      <div className={"site-layout-content"}>
        <LoadingOutlined />
      </div>
    );
  }

  return (
    <NodeLoader node={node} renderNextButton={null} renderSubmitButton={null} />
  );
};
