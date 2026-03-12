import { plankaClient } from '../client.js';

export async function getComments(cardId: string, beforeId?: string) {
  const qs = beforeId ? `?beforeId=${encodeURIComponent(beforeId)}` : '';
  return plankaClient.get(`/api/cards/${cardId}/comments${qs}`);
}

export async function createComment(cardId: string, body: { text: string }) {
  return plankaClient.post(`/api/cards/${cardId}/comments`, body);
}

export async function updateComment(id: string, body: { text: string }) {
  return plankaClient.patch(`/api/comments/${id}`, body);
}

export async function deleteComment(id: string) {
  return plankaClient.delete(`/api/comments/${id}`);
}
