import { plankaClient } from '../client.js';

export async function getConfig() {
  return plankaClient.get('/api/config');
}

export async function updateConfig(body: Record<string, unknown>) {
  return plankaClient.patch('/api/config', body);
}

export async function testSmtp() {
  return plankaClient.post('/api/config/test-smtp');
}
