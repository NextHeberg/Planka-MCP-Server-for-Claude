import { plankaClient } from '../client.js';

export async function createLinkAttachment(cardId: string, body: { url: string; name: string }) {
  return plankaClient.post(`/api/cards/${cardId}/attachments`, { type: 'link', ...body });
}

export async function updateAttachment(id: string, body: { name: string }) {
  return plankaClient.patch(`/api/attachments/${id}`, body);
}

export async function deleteAttachment(id: string) {
  return plankaClient.delete(`/api/attachments/${id}`);
}
