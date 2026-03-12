import { plankaClient } from '../client.js';

export async function createTaskList(cardId: string, body: Record<string, unknown>) {
  return plankaClient.post(`/api/cards/${cardId}/task-lists`, body);
}

export async function getTaskList(id: string) {
  return plankaClient.get(`/api/task-lists/${id}`);
}

export async function updateTaskList(id: string, body: Record<string, unknown>) {
  return plankaClient.patch(`/api/task-lists/${id}`, body);
}

export async function deleteTaskList(id: string) {
  return plankaClient.delete(`/api/task-lists/${id}`);
}
