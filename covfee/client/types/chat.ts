export type ChatMessage = {
  id: number;
  chat_id: number;
  message: string;
  created_at: Date;
};

export type IoChatMessage = ChatMessage;

export type Chat = {
  id: number;
  node_id: number | null;
  journey_id: string | null;
  messages: ChatMessage[];
  created_at: Date;
};
