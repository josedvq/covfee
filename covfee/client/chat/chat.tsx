import * as React from "react";
import { Chat, ChatMessage, IoChatMessage } from "../types/chat";
import { AllPropsRequired } from "../types/utils";
import { styled } from "styled-components";

type ChatPopupProps = {
  chats: Chat[];
};

export const ChatPopup: React.FC<ChatPopupProps> = (props) => {
  const args: AllPropsRequired<ChatPopupProps> = {
    ...props,
  };

  const [currChat, setCurrChat] = React.useState(null);

  return (
    <PopupContainer>
      <div>{currChat && <Chatbox chat={args.chats[currChat]} />}</div>
      <div>
        {args.chats.map((chat, index) => (
          <ChatButton
            active={currChat == index}
            onClick={() => {
              setCurrChat(index);
            }}
          ></ChatButton>
        ))}
      </div>
    </PopupContainer>
  );
};

const PopupContainer = styled.div<any>``;
const ChatButton = styled.button<any>`
  background-color: ${(props) => (props.active ? "blue" : "gray")};
`;

type ChatboxProps = {
  chat: Chat;
};

export const Chatbox: React.FC<ChatboxProps> = (props) => {
  const args: AllPropsRequired<ChatboxProps> = {
    ...props,
  };

  return (
    <ChatboxContainer>
      {args.chat.messages.map((message) => (
        <li>
          <span>{message.created_at.toDateString()}</span>
          <span>{message.message}</span>
        </li>
      ))}
    </ChatboxContainer>
  );
};

const ChatboxContainer = styled.div<any>``;
