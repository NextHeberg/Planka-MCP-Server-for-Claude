import { plankaClient } from '../client.js';

export async function createTask(taskListId: string, body: Record<string, unknown>) {
  return plankaClient.post(`/api/task-lists/${taskListId}/tasks`, body);
}

export async function updateTask(id: string, body: Record<string, unknown>) {
  return plankaClient.patch(`/api/tasks/${id}`, body);
}

export async function deleteTask(id: string) {
  return plankaClient.delete(`/api/tasks/${id}`);
}
