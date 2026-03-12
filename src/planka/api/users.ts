import { plankaClient } from '../client.js';

export async function getUsers() {
  return plankaClient.get('/api/users');
}

export async function createUser(body: Record<string, unknown>) {
  return plankaClient.post('/api/users', body);
}

export async function getUser(id: string) {
  return plankaClient.get(`/api/users/${id}`);
}

export async function updateUser(id: string, body: Record<string, unknown>) {
  return plankaClient.patch(`/api/users/${id}`, body);
}

export async function deleteUser(id: string) {
  return plankaClient.delete(`/api/users/${id}`);
}

export async function updateUserEmail(id: string, body: { email: string; currentPassword?: string }) {
  return plankaClient.patch(`/api/users/${id}/email`, body);
}

export async function updateUserPassword(id: string, body: { password: string; currentPassword?: string }) {
  return plankaClient.patch(`/api/users/${id}/password`, body);
}

export async function updateUserUsername(id: string, body: { username?: string | null; currentPassword?: string }) {
  return plankaClient.patch(`/api/users/${id}/username`, body);
}

export async function createUserApiKey(id: string) {
  return plankaClient.post(`/api/users/${id}/api-key`);
}
