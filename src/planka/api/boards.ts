import { plankaClient } from '../client.js';

export async function createBoard(projectId: string, body: { position: number; name: string; importType?: string }) {
  return plankaClient.post(`/api/projects/${projectId}/boards`, body);
}

export async function getBoard(id: string) {
  return plankaClient.get(`/api/boards/${id}`);
}

export async function updateBoard(id: string, body: Record<string, unknown>) {
  return plankaClient.patch(`/api/boards/${id}`, body);
}

export async function deleteBoard(id: string) {
  return plankaClient.delete(`/api/boards/${id}`);
}

export async function getBoardActions(boardId: string, beforeId?: string) {
  const qs = beforeId ? `?beforeId=${encodeURIComponent(beforeId)}` : '';
  return plankaClient.get(`/api/boards/${boardId}/actions${qs}`);
}

export async function createBoardMembership(
  boardId: string,
  body: { userId: string; role: string; canComment?: boolean | null },
) {
  return plankaClient.post(`/api/boards/${boardId}/board-memberships`, body);
}

export async function updateBoardMembership(id: string, body: Record<string, unknown>) {
  return plankaClient.patch(`/api/board-memberships/${id}`, body);
}

export async function deleteBoardMembership(id: string) {
  return plankaClient.delete(`/api/board-memberships/${id}`);
}
