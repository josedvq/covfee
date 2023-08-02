import * as React from "react";
import { nodeContext } from "./node_context";
import Constants from "Constants";

export const NodeProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const [logged, setLogged] = React.useState(false);
  const [username, setUsername] = React.useState(null);
  const [loginTime, setLoginTime] = React.useState(null);
  const [roles, setRoles] = React.useState([]);

  React.useEffect(() => {}, []);

  const contextMethods: UserContextMethods = {};

  return (
    <nodeContext.Provider
      value={{
        ...contextMethods,
      }}
    >
      {children}
    </nodeContext.Provider>
  );
};
