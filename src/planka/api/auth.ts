import { plankaClient } from '../client.js';

export async function deleteAccessToken() {
  return plankaClient.delete('/api/access-tokens/me');
}

export async function getBootstrap() {
  return plankaClient.get('/api/bootstrap');
}
