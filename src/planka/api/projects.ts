import { plankaClient } from '../client.js';

export async function getProjects() {
  return plankaClient.get('/api/projects');
}

export async function createProject(body: { type: string; name: string; description?: string | null }) {
  return plankaClient.post('/api/projects', body);
}

export async function getProject(id: string) {
  return plankaClient.get(`/api/projects/${id}`);
}

export async function updateProject(id: string, body: Record<string, unknown>) {
  return plankaClient.patch(`/api/projects/${id}`, body);
}

export async function deleteProject(id: string) {
  return plankaClient.delete(`/api/projects/${id}`);
}

export async function createProjectManager(projectId: string, body: { userId: string }) {
  return plankaClient.post(`/api/projects/${projectId}/project-managers`, body);
}

export async function deleteProjectManager(id: string) {
  return plankaClient.delete(`/api/project-managers/${id}`);
}

export async function createBaseCustomFieldGroup(projectId: string, body: { name: string }) {
  return plankaClient.post(`/api/projects/${projectId}/base-custom-field-groups`, body);
}
