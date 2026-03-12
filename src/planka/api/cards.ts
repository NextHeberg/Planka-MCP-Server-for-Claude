import { plankaClient } from '../client.js';

export async function getCards(
  listId: string,
  params?: { search?: string; userIds?: string; labelIds?: string; beforeId?: string },
) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.userIds) qs.set('userIds', params.userIds);
  if (params?.labelIds) qs.set('labelIds', params.labelIds);
  if (params?.beforeId) qs.set('before[id]', params.beforeId);
  const q = qs.toString();
  return plankaClient.get(`/api/lists/${listId}/cards${q ? '?' + q : ''}`);
}

export async function createCard(listId: string, body: Record<string, unknown>) {
  return plankaClient.post(`/api/lists/${listId}/cards`, body);
}

export async function getCard(id: string) {
  return plankaClient.get(`/api/cards/${id}`);
}

export async function updateCard(id: string, body: Record<string, unknown>) {
  return plankaClient.patch(`/api/cards/${id}`, body);
}

export async function deleteCard(id: string) {
  return plankaClient.delete(`/api/cards/${id}`);
}

export async function duplicateCard(id: string, body: Record<string, unknown>) {
  return plankaClient.post(`/api/cards/${id}/duplicate`, body);
}

export async function readCardNotifications(id: string) {
  return plankaClient.post(`/api/cards/${id}/read-notifications`);
}

export async function getCardActions(cardId: string, beforeId?: string) {
  const qs = beforeId ? `?beforeId=${encodeURIComponent(beforeId)}` : '';
  return plankaClient.get(`/api/cards/${cardId}/actions${qs}`);
}
