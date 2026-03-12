import { plankaClient } from '../client.js';

export async function updateBaseCustomFieldGroup(id: string, body: { name: string }) {
  return plankaClient.patch(`/api/base-custom-field-groups/${id}`, body);
}

export async function deleteBaseCustomFieldGroup(id: string) {
  return plankaClient.delete(`/api/base-custom-field-groups/${id}`);
}

export async function createCustomFieldInBaseGroup(
  baseCustomFieldGroupId: string,
  body: { position: number; name: string; showOnFrontOfCard?: boolean },
) {
  return plankaClient.post(
    `/api/base-custom-field-groups/${baseCustomFieldGroupId}/custom-fields`,
    body,
  );
}

export async function createBoardCustomFieldGroup(
  boardId: string,
  body: { baseCustomFieldGroupId?: string; position: number; name?: string | null },
) {
  return plankaClient.post(`/api/boards/${boardId}/custom-field-groups`, body);
}

export async function createCardCustomFieldGroup(
  cardId: string,
  body: { baseCustomFieldGroupId?: string; position: number; name?: string | null },
) {
  return plankaClient.post(`/api/cards/${cardId}/custom-field-groups`, body);
}

export async function getCustomFieldGroup(id: string) {
  return plankaClient.get(`/api/custom-field-groups/${id}`);
}

export async function updateCustomFieldGroup(id: string, body: Record<string, unknown>) {
  return plankaClient.patch(`/api/custom-field-groups/${id}`, body);
}

export async function deleteCustomFieldGroup(id: string) {
  return plankaClient.delete(`/api/custom-field-groups/${id}`);
}

export async function createCustomFieldInGroup(
  customFieldGroupId: string,
  body: { position: number; name: string; showOnFrontOfCard?: boolean },
) {
  return plankaClient.post(
    `/api/custom-field-groups/${customFieldGroupId}/custom-fields`,
    body,
  );
}

export async function updateCustomField(id: string, body: Record<string, unknown>) {
  return plankaClient.patch(`/api/custom-fields/${id}`, body);
}

export async function deleteCustomField(id: string) {
  return plankaClient.delete(`/api/custom-fields/${id}`);
}

export async function updateCustomFieldValue(
  cardId: string,
  customFieldGroupId: string,
  customFieldId: string,
  body: { content: string },
) {
  return plankaClient.patch(
    `/api/cards/${cardId}/custom-field-values/customFieldGroupId:${customFieldGroupId}:customFieldId:${customFieldId}`,
    body,
  );
}

export async function deleteCustomFieldValue(
  cardId: string,
  customFieldGroupId: string,
  customFieldId: string,
) {
  return plankaClient.delete(
    `/api/cards/${cardId}/custom-field-value/customFieldGroupId:${customFieldGroupId}:customFieldId:${customFieldId}`,
  );
}
