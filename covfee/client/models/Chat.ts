import * as React from "react";
import { Chat, ChatMessage, IoChatMessage } from "../types/chat";
import { fetcher, throwBadResponse } from "../utils";
import Constants from "Constants";
import { appContext } from "../app_context";

export const useChats = (data: Chat[]) => {
  const [chats, setChats] = React.useState<{ [id: number]: Chat }>(
    Object.fromEntries(data.map((chat) => [chat.id, chat]))
  );
  const { socket } = React.useContext(appContext);

  React.useEffect(() => {
    if (chats && socket) {
      socket.on("chat", (payload: IoChatMessage) => {
        setChats({
          ...chats,
          [payload.chat_id]: {
            ...chats[payload.chat_id],
            messages: [...chats[payload.chat_id].messages, payload],
          },
        });
      });
    }
  }, [chats, socket]);

  const addChat = (id: number) => {
    getChat(id).then((chat) => {
      setChats({
        ...chats,
        [id]: chat,
      });
    });
  };

  const removeChat = (id: number) => {
    const { [id]: _, ...newChats } = chats;
    setChats({
      ...newChats,
    });
  };

  return {
    chats: Object.values(chats),
    addChat,
    removeChat,
  };
};

export type UseChats = ReturnType<typeof useChats>;

export async function getChat(id: number): Promise<Chat> {
  const url = Constants.api_url + "/chats/" + id;

  return await fetcher(url).then(throwBadResponse);
}
