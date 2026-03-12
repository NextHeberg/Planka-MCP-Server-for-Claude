import { plankaClient } from '../client.js';

export async function createCardMembership(cardId: string, body: { userId: string }) {
  return plankaClient.post(`/api/cards/${cardId}/card-memberships`, body);
}

export async function deleteCardMembership(cardId: string, userId: string) {
  return plankaClient.delete(`/api/cards/${cardId}/card-memberships/userId:${userId}`);
}
