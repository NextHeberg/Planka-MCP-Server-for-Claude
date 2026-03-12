import { plankaClient } from '../client.js';

export async function createBoardNotificationService(
  boardId: string,
  body: { url: string; format: string },
) {
  return plankaClient.post(`/api/boards/${boardId}/notification-services`, body);
}

export async function createUserNotificationService(
  userId: string,
  body: { url: string; format: string },
) {
  return plankaClient.post(`/api/users/${userId}/notification-services`, body);
}

export async function updateNotificationService(id: string, body: Record<string, unknown>) {
  return plankaClient.patch(`/api/notification-services/${id}`, body);
}

export async function deleteNotificationService(id: string) {
  return plankaClient.delete(`/api/notification-services/${id}`);
}

export async function testNotificationService(id: string) {
  return plankaClient.post(`/api/notification-services/${id}/test`);
}
