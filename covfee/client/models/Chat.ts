import * as React from "react";
import { Chat, ChatMessage, IoChatMessage } from "../types/chat";
import { fetcher, throwBadResponse } from "../utils";
import Constants from "Constants";
import { ChatSocket } from "../app_context";

export const useChats = (chocket: ChatSocket, chat_ids: number[] = []) => {
  const [chatIdsToListen, setChatIdsToListen] =
    React.useState<number[]>(chat_ids);
  const [chats, setChats] = React.useState<{ [id: number]: Chat }>({});
  // Object.fromEntries(data.map((chat) => [chat.id, chat]))

  React.useEffect(() => {
    if (Object.keys(chats).length && chocket) {
      chocket.removeAllListeners("message");
      chocket.on("message", (payload: IoChatMessage) => {
        console.log(`MESSAGE: ${payload.message}`);
        if (payload.chat_id in chats) {
          setChats({
            ...chats,
            [payload.chat_id]: {
              ...chats[payload.chat_id],
              messages: [...chats[payload.chat_id].messages, payload],
            },
          });
        } else {
          if (
            chatIdsToListen.length || // listen to all chats by default
            chatIdsToListen.includes(payload.chat_id)
          ) {
            addChats([payload.chat_id]);
          }
        }
      });
    }
  }, [chats, chocket]);

  const addChatListeners = (ids: number[]) => {
    setChatIdsToListen([...chatIdsToListen, ...ids]);
  };

  const clearChatListeners = () => {
    setChatIdsToListen([]);
  };

  const addChats = (ids: number[]) => {
    addChatListeners(ids);
    getChats(ids).then((res) => {
      const newChats = Object.fromEntries(res.map((chat) => [chat.id, chat]));
      setChats({
        ...chats,
        ...newChats,
      });
    });
  };

  const removeChats = (id: number) => {
    const { [id]: _, ...newChats } = chats;
    setChats({
      ...newChats,
    });
  };

  const clearChats = () => {
    setChats({});
  };

  const emitMessage = (chatId: number, message: string) => {
    chocket.emit("message", { chatId, message });
  };

  return {
    chats: Object.values(chats),
    addChatListeners,
    clearChatListeners,
    addChats,
    clearChats,
    removeChats,
    emitMessage,
  };
};

export type UseChats = ReturnType<typeof useChats>;

export async function getChats(chat_ids: number[]): Promise<Chat[]> {
  const url = Constants.api_url + "/chats/" + chat_ids.join(",");

  return await fetcher(url).then(throwBadResponse);
}
