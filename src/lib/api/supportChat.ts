import { api } from "./client";
import type { ChatMessage, ConversationMessage } from "./messages";

export const SUPPORT_ROLES = [
  "support",
  "support_technique",
  "support_commercial",
  "super_admin",
];
export interface SupportChat {
  id: string;
  userId: string;
  department: string;
  status: "open" | "closed";
  waiting: boolean;
  user: {
    id: string;
    fullName: string;
    role: string;
    profilePhoto?: string | null;
  };
  assignedTo: { id: string; fullName: string; role: string } | null;
  lastMessage: ChatMessage | null;
  lastMessageAt: string;
  unreadCount?: number;
}
export interface SupportChatThread {
  conversation: SupportChat;
  messages: ConversationMessage[];
}
export interface SupportContent {
  ticketId?: string;
  body?: string;
  audioUrl?: string;
  photoUrl?: string;
  videoUrl?: string;
}

export async function heartbeat(connectionId: string, available: boolean) {
  await api.post("/support/chat/presence", { connectionId, available });
}
export async function openSupportChat(
  userId?: string,
  department = "general",
): Promise<SupportChat> {
  const { data } = await api.post("/support/chat/conversations", {
    userId,
    department,
  });
  return data.conversation;
}
export async function supportChats(): Promise<SupportChat[]> {
  const { data } = await api.get("/support/chat/conversations");
  return data.conversations;
}
export async function supportThread(id: string): Promise<SupportChatThread> {
  const { data } = await api.get(`/support/chat/conversations/${id}`);
  return data;
}
export async function supportSend(
  id: string,
  content: SupportContent,
): Promise<ChatMessage> {
  const { data } = await api.post(
    `/support/chat/conversations/${id}/messages`,
    content,
  );
  return data.message;
}
export async function claimSupportChat(id: string): Promise<SupportChat> {
  const { data } = await api.post(`/support/chat/conversations/${id}/claim`);
  return data.conversation;
}
export async function closeSupportChat(id: string): Promise<void> {
  await api.post(`/support/chat/conversations/${id}/close`);
}

export async function mySupportChat(): Promise<SupportChat | null> {
  const { data } = await api.get("/support/chat/mine");
  return data.conversation;
}

export interface AvailableSupportAgent {
  id: string;
  fullName: string;
  role: string;
  activeCases: number;
}
export async function availableSupportAgents(): Promise<
  AvailableSupportAgent[]
> {
  const { data } = await api.get("/support/chat/agents");
  return data.agents;
}
export async function transferSupportChat(
  id: string,
  agentId: string,
  expectedAssignedToId: string | null,
): Promise<SupportChat> {
  const { data } = await api.post(
    `/support/chat/conversations/${id}/transfer`,
    { agentId, expectedAssignedToId },
  );
  return data.conversation;
}
