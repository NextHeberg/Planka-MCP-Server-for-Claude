import { plankaClient } from '../client.js';

export async function createList(boardId: string, body: { type: string; position: number; name: string }) {
  return plankaClient.post(`/api/boards/${boardId}/lists`, body);
}

export async function getList(id: string) {
  return plankaClient.get(`/api/lists/${id}`);
}

export async function updateList(id: string, body: Record<string, unknown>) {
  return plankaClient.patch(`/api/lists/${id}`, body);
}

export async function deleteList(id: string) {
  return plankaClient.delete(`/api/lists/${id}`);
}

export async function sortList(id: string, body: { fieldName: string; order?: string }) {
  return plankaClient.post(`/api/lists/${id}/sort`, body);
}

export async function moveListCards(id: string, body: { listId: string }) {
  return plankaClient.post(`/api/lists/${id}/move-cards`, body);
}

export async function clearList(id: string) {
  return plankaClient.post(`/api/lists/${id}/clear`);
}
