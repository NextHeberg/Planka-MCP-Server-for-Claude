import { plankaClient } from '../client.js';

export async function getWebhooks() {
  return plankaClient.get('/api/webhooks');
}

export async function createWebhook(body: Record<string, unknown>) {
  return plankaClient.post('/api/webhooks', body);
}

export async function updateWebhook(id: string, body: Record<string, unknown>) {
  return plankaClient.patch(`/api/webhooks/${id}`, body);
}

export async function deleteWebhook(id: string) {
  return plankaClient.delete(`/api/webhooks/${id}`);
}
