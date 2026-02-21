/**
 * Chat REST API. Uses shared api (Bearer token). Base: VITE_API_URL.
 */
import { api } from './api';

const chatBase = 'chat';
const usersBase = 'users';

export const chatService = {
  /** GET /users/:userId/can-chat → { canChat: boolean } */
  async getCanChat(userId) {
    const { data } = await api.get(`${usersBase}/${userId}/can-chat`);
    return data?.data ?? data;
  },

  /** POST /chat/conversations/start body { otherUserId } → conversation */
  async startConversation(otherUserId) {
    const { data } = await api.post(`${chatBase}/conversations/start`, { otherUserId });
    return data?.data ?? data;
  },

  /** GET /chat/conversations → { data: conversations[], meta: { pagination } } */
  async getConversations(params = {}) {
    const { data } = await api.get(`${chatBase}/conversations`, { params });
    const list = data?.data ?? data ?? [];
    const pagination = data?.meta?.pagination ?? data?.pagination;
    return { conversations: Array.isArray(list) ? list : [], pagination };
  },

  /** GET /chat/conversations/:id/messages → { data: messages[], meta: { pagination } } */
  async getMessages(conversationId, params = {}) {
    const { data } = await api.get(`${chatBase}/conversations/${conversationId}/messages`, { params });
    const list = data?.data ?? data ?? [];
    const pagination = data?.meta?.pagination ?? data?.pagination;
    return { messages: Array.isArray(list) ? list : [], pagination };
  },
};
