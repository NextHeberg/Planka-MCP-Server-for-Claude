import { plankaClient } from '../client.js';

export async function getNotifications() {
  return plankaClient.get('/api/notifications');
}

export async function getNotification(id: string) {
  return plankaClient.get(`/api/notifications/${id}`);
}

export async function updateNotification(id: string, body: { isRead: boolean }) {
  return plankaClient.patch(`/api/notifications/${id}`, body);
}

export async function readAllNotifications() {
  return plankaClient.post('/api/notifications/read-all');
}
