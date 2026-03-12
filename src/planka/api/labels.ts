import { plankaClient } from '../client.js';

export async function createLabel(boardId: string, body: { position: number; name?: string | null; color: string }) {
  return plankaClient.post(`/api/boards/${boardId}/labels`, body);
}

export async function updateLabel(id: string, body: Record<string, unknown>) {
  return plankaClient.patch(`/api/labels/${id}`, body);
}

export async function deleteLabel(id: string) {
  return plankaClient.delete(`/api/labels/${id}`);
}

export async function createCardLabel(cardId: string, body: { labelId: string }) {
  return plankaClient.post(`/api/cards/${cardId}/card-labels`, body);
}

export async function deleteCardLabel(cardId: string, labelId: string) {
  return plankaClient.delete(`/api/cards/${cardId}/card-labels/labelId:${labelId}`);
}
