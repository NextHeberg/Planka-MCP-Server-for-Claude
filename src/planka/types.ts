// Planka v2 — Complete TypeScript type definitions

export interface Project {
  id: string;
  ownerProjectManagerId: string | null;
  backgroundImageId: string | null;
  name: string;
  description: string | null;
  backgroundType: 'gradient' | 'image';
  backgroundGradient: string;
  isHidden: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Board {
  id: string;
  projectId: string;
  position: number;
  name: string;
  defaultView: 'kanban' | 'grid' | 'list';
  defaultCardType: 'project' | 'story';
  limitCardTypesToDefaultOne: boolean;
  alwaysDisplayCardCreator: boolean;
  expandTaskListsByDefault: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BoardMembership {
  id: string;
  projectId: string;
  boardId: string;
  userId: string;
  role: 'editor' | 'viewer';
  canComment: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface List {
  id: string;
  boardId: string;
  type: 'active' | 'closed' | 'archive' | 'trash';
  position: number | null;
  name: string | null;
  color: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Card {
  id: string;
  boardId: string;
  listId: string;
  creatorUserId: string | null;
  prevListId: string | null;
  coverAttachmentId: string | null;
  type: 'project' | 'story';
  position: number | null;
  name: string;
  description: string | null;
  dueDate: string | null;
  isDueCompleted: boolean | null;
  stopwatch: { startedAt: string; total: number } | null;
  commentsTotal: number;
  isClosed: boolean;
  listChangedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CardMembership {
  id: string;
  cardId: string;
  userId: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CardLabel {
  id: string;
  cardId: string;
  labelId: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Label {
  id: string;
  boardId: string;
  position: number;
  name: string | null;
  color: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface TaskList {
  id: string;
  cardId: string;
  position: number;
  name: string;
  showOnFrontOfCard: boolean;
  hideCompletedTasks: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Task {
  id: string;
  taskListId: string;
  linkedCardId: string | null;
  assigneeUserId: string | null;
  position: number;
  name: string;
  isCompleted: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Comment {
  id: string;
  cardId: string;
  userId: string | null;
  text: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Attachment {
  id: string;
  cardId: string;
  creatorUserId: string | null;
  type: 'file' | 'link';
  data: Record<string, unknown>;
  name: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'projectOwner' | 'boardUser';
  name: string;
  username: string | null;
  phone: string | null;
  organization: string | null;
  language: string;
  isDeactivated: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  creatorUserId: string | null;
  boardId: string;
  cardId: string;
  commentId: string | null;
  actionId: string | null;
  type: 'moveCard' | 'commentCard' | 'addMemberToCard' | 'mentionInComment';
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Action {
  id: string;
  boardId: string | null;
  cardId: string;
  userId: string | null;
  type: 'createCard' | 'moveCard' | 'addMemberToCard' | 'removeMemberFromCard' | 'completeTask' | 'uncompleteTask';
  data: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CustomFieldGroup {
  id: string;
  boardId: string | null;
  cardId: string | null;
  baseCustomFieldGroupId: string | null;
  position: number;
  name: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BaseCustomFieldGroup {
  id: string;
  projectId: string;
  name: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CustomField {
  id: string;
  baseCustomFieldGroupId: string | null;
  customFieldGroupId: string | null;
  position: number;
  name: string;
  showOnFrontOfCard: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CustomFieldValue {
  id: string;
  cardId: string;
  customFieldGroupId: string;
  customFieldId: string;
  content: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  accessToken: string | null;
  events: string[];
  excludedEvents: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProjectManager {
  id: string;
  projectId: string;
  userId: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BackgroundImage {
  id: string;
  projectId: string;
  url: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface NotificationService {
  id: string;
  boardId: string | null;
  userId: string | null;
  url: string;
  format: 'text' | 'markdown' | 'html';
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Config {
  smtpHost: string | null;
  smtpPort: number | null;
  smtpName: string | null;
  smtpSecure: boolean;
  smtpTlsRejectUnauthorized: boolean;
  smtpUser: string | null;
  smtpPassword: string | null;
  smtpFrom: string | null;
}

export interface BootstrapResponse {
  oidc: {
    authorizationUrl: string;
    endSessionUrl: string | null;
    isEnforced: boolean;
  };
  activeUsersLimit?: number | null;
  customerPanelUrl?: string;
  termsLanguages?: string[];
  version: string;
}

// Generic Planka API response wrappers
export interface PlankaItemResponse<T> {
  item: T;
  included?: Record<string, unknown>;
}

export interface PlankaListResponse<T> {
  items: T[];
  included?: Record<string, unknown>;
}

export interface PlankaErrorResponse {
  error: true;
  status: number;
  message: string;
}
