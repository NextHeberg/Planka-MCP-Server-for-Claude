import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// API modules
import * as authApi from './planka/api/auth.js';
import * as projectsApi from './planka/api/projects.js';
import * as boardsApi from './planka/api/boards.js';
import * as listsApi from './planka/api/lists.js';
import * as cardsApi from './planka/api/cards.js';
import * as taskListsApi from './planka/api/task-lists.js';
import * as tasksApi from './planka/api/tasks.js';
import * as labelsApi from './planka/api/labels.js';
import * as cardMembershipsApi from './planka/api/card-memberships.js';
import * as commentsApi from './planka/api/comments.js';
import * as attachmentsApi from './planka/api/attachments.js';
import * as customFieldsApi from './planka/api/custom-fields.js';
import * as usersApi from './planka/api/users.js';
import * as notificationsApi from './planka/api/notifications.js';
import * as notificationServicesApi from './planka/api/notification-services.js';
import * as webhooksApi from './planka/api/webhooks.js';
import * as configApi from './planka/api/config.js';

// Helper: wrap tool handler with try/catch, always return JSON text
function jsonResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

async function safeTool(fn: () => Promise<unknown>) {
  try {
    const result = await fn();
    return jsonResult(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResult({ error: true, status: 0, message });
  }
}

// Zod enums used across tools
const cardTypeEnum = z.enum(['project', 'story']);
const listTypeEnum = z.enum(['active', 'closed']);
const boardViewEnum = z.enum(['kanban', 'grid', 'list']);
const userRoleEnum = z.enum(['admin', 'projectOwner', 'boardUser']);
const boardMemberRoleEnum = z.enum(['editor', 'viewer']);
const projectTypeEnum = z.enum(['private', 'shared']);
const notifFormatEnum = z.enum(['text', 'markdown', 'html']);
const sortFieldEnum = z.enum(['name', 'dueDate', 'createdAt']);
const sortOrderEnum = z.enum(['asc', 'desc']);
const backgroundTypeEnum = z.enum(['gradient', 'image']);
const editorModeEnum = z.enum(['wysiwyg', 'markup']);
const homeViewEnum = z.enum(['gridProjects', 'groupedProjects']);
const projectsOrderEnum = z.enum(['byDefault', 'alphabetically', 'byCreationTime']);

const backgroundGradientEnum = z.enum([
  'old-lime', 'ocean-dive', 'tzepesch-style', 'jungle-mesh', 'strawberry-dust',
  'purple-rose', 'sun-scream', 'warm-rust', 'sky-change', 'green-eyes',
  'blue-xchange', 'blood-orange', 'sour-peel', 'green-ninja', 'algae-green',
  'coral-reef', 'steel-grey', 'heat-waves', 'velvet-lounge', 'purple-rain',
  'blue-steel', 'blueish-curve', 'prism-light', 'green-mist', 'red-curtain',
]);

const labelColorEnum = z.enum([
  'muddy-grey', 'autumn-leafs', 'morning-sky', 'antique-blue', 'egg-yellow',
  'desert-sand', 'dark-granite', 'fresh-salad', 'lagoon-blue', 'midnight-blue',
  'light-orange', 'pumpkin-orange', 'light-concrete', 'sunny-grass', 'navy-blue',
  'lilac-eyes', 'apricot-red', 'orange-peel', 'silver-glint', 'bright-moss',
  'deep-ocean', 'summer-sky', 'berry-red', 'light-cocoa', 'grey-stone',
  'tank-green', 'coral-green', 'sugar-plum', 'pink-tulip', 'shady-rust',
  'wet-rock', 'wet-moss', 'turquoise-sea', 'lavender-fields', 'piggy-red',
  'light-mud', 'gun-metal', 'modern-green', 'french-coast', 'sweet-lilac',
  'red-burgundy', 'pirate-gold',
]);

const listColorEnum = z.enum([
  'berry-red', 'pumpkin-orange', 'lagoon-blue', 'pink-tulip', 'light-mud',
  'orange-peel', 'bright-moss', 'antique-blue', 'dark-granite', 'turquoise-sea',
]);

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'planka-mcp-server',
    version: '1.0.0',
  });

  // ============================================================
  // AUTH & SYSTEM
  // ============================================================

  server.tool('planka_get_bootstrap', 'Get Planka instance info (version, OIDC config, limits)', {}, async () => {
    return safeTool(() => authApi.getBootstrap());
  });

  server.tool('planka_get_config', 'Get Planka SMTP configuration (admin only)', {}, async () => {
    return safeTool(() => configApi.getConfig());
  });

  server.tool('planka_update_config', 'Update Planka SMTP configuration (admin only)', {
    smtpHost: z.string().optional(),
    smtpPort: z.number().optional(),
    smtpName: z.string().optional(),
    smtpSecure: z.boolean().optional(),
    smtpTlsRejectUnauthorized: z.boolean().optional(),
    smtpUser: z.string().optional(),
    smtpPassword: z.string().optional(),
    smtpFrom: z.string().optional(),
  }, async (args) => {
    return safeTool(() => configApi.updateConfig(args));
  });

  server.tool('planka_test_smtp', 'Test SMTP configuration (admin only)', {}, async () => {
    return safeTool(() => configApi.testSmtp());
  });

  // ============================================================
  // USERS
  // ============================================================

  server.tool('planka_list_users', 'List all users in Planka', {}, async () => {
    return safeTool(() => usersApi.getUsers());
  });

  server.tool('planka_create_user', 'Create a new user', {
    email: z.string().describe('User email address'),
    password: z.string().describe('User password'),
    role: userRoleEnum.describe('User role'),
    name: z.string().describe('Display name'),
    username: z.string().nullish().describe('Username (optional)'),
    phone: z.string().nullish().describe('Phone number (optional)'),
    organization: z.string().nullish().describe('Organization (optional)'),
    language: z.string().optional().describe('Language code (optional)'),
    subscribeToOwnCards: z.boolean().optional(),
    subscribeToCardWhenCommenting: z.boolean().optional(),
    turnOffRecentCardHighlighting: z.boolean().optional(),
  }, async (args) => {
    return safeTool(() => usersApi.createUser(args));
  });

  server.tool('planka_get_user', 'Get a user by ID', {
    id: z.string().describe('User ID'),
  }, async ({ id }) => {
    return safeTool(() => usersApi.getUser(id));
  });

  server.tool('planka_update_user', 'Update a user', {
    id: z.string().describe('User ID'),
    role: userRoleEnum.optional(),
    name: z.string().optional(),
    phone: z.string().nullish(),
    organization: z.string().nullish(),
    language: z.string().optional(),
    subscribeToOwnCards: z.boolean().optional(),
    subscribeToCardWhenCommenting: z.boolean().optional(),
    turnOffRecentCardHighlighting: z.boolean().optional(),
    enableFavoritesByDefault: z.boolean().optional(),
    defaultEditorMode: editorModeEnum.optional(),
    defaultHomeView: homeViewEnum.optional(),
    defaultProjectsOrder: projectsOrderEnum.optional(),
    isDeactivated: z.boolean().optional(),
  }, async ({ id, ...body }) => {
    return safeTool(() => usersApi.updateUser(id, body));
  });

  server.tool('planka_delete_user', 'Delete a user', {
    id: z.string().describe('User ID'),
  }, async ({ id }) => {
    return safeTool(() => usersApi.deleteUser(id));
  });

  server.tool('planka_update_user_email', 'Update a user email address', {
    id: z.string().describe('User ID'),
    email: z.string().describe('New email address'),
    currentPassword: z.string().optional().describe('Current password (required for self-update)'),
  }, async ({ id, ...body }) => {
    return safeTool(() => usersApi.updateUserEmail(id, body));
  });

  server.tool('planka_update_user_password', 'Update a user password', {
    id: z.string().describe('User ID'),
    password: z.string().describe('New password'),
    currentPassword: z.string().optional().describe('Current password (required for self-update)'),
  }, async ({ id, ...body }) => {
    return safeTool(() => usersApi.updateUserPassword(id, body));
  });

  server.tool('planka_update_user_username', 'Update a user username', {
    id: z.string().describe('User ID'),
    username: z.string().nullish().describe('New username (null to remove)'),
    currentPassword: z.string().optional().describe('Current password (required for self-update)'),
  }, async ({ id, ...body }) => {
    return safeTool(() => usersApi.updateUserUsername(id, body));
  });

  server.tool('planka_create_user_api_key', 'Generate a new API key for a user', {
    id: z.string().describe('User ID'),
  }, async ({ id }) => {
    return safeTool(() => usersApi.createUserApiKey(id));
  });

  // ============================================================
  // PROJECTS
  // ============================================================

  server.tool('planka_list_projects', 'List all projects with boards, members, and labels', {}, async () => {
    return safeTool(() => projectsApi.getProjects());
  });

  server.tool('planka_create_project', 'Create a new project', {
    type: projectTypeEnum.describe('Project type'),
    name: z.string().describe('Project name'),
    description: z.string().nullish().describe('Project description'),
  }, async (args) => {
    return safeTool(() => projectsApi.createProject(args));
  });

  server.tool('planka_get_project', 'Get a project by ID with all its boards and members', {
    id: z.string().describe('Project ID'),
  }, async ({ id }) => {
    return safeTool(() => projectsApi.getProject(id));
  });

  server.tool('planka_update_project', 'Update a project', {
    id: z.string().describe('Project ID'),
    ownerProjectManagerId: z.string().nullish(),
    backgroundImageId: z.string().nullish(),
    name: z.string().optional(),
    description: z.string().nullish(),
    backgroundType: backgroundTypeEnum.optional(),
    backgroundGradient: backgroundGradientEnum.optional(),
    isHidden: z.boolean().optional(),
    isFavorite: z.boolean().optional(),
  }, async ({ id, ...body }) => {
    return safeTool(() => projectsApi.updateProject(id, body));
  });

  server.tool('planka_delete_project', 'Delete a project and all its boards/cards', {
    id: z.string().describe('Project ID'),
  }, async ({ id }) => {
    return safeTool(() => projectsApi.deleteProject(id));
  });

  server.tool('planka_add_project_manager', 'Add a manager to a project', {
    projectId: z.string().describe('Project ID'),
    userId: z.string().describe('User ID to add as manager'),
  }, async ({ projectId, userId }) => {
    return safeTool(() => projectsApi.createProjectManager(projectId, { userId }));
  });

  server.tool('planka_remove_project_manager', 'Remove a project manager', {
    id: z.string().describe('Project manager ID'),
  }, async ({ id }) => {
    return safeTool(() => projectsApi.deleteProjectManager(id));
  });

  server.tool('planka_create_base_custom_field_group', 'Create a base custom field group in a project', {
    projectId: z.string().describe('Project ID'),
    name: z.string().describe('Group name'),
  }, async ({ projectId, name }) => {
    return safeTool(() => projectsApi.createBaseCustomFieldGroup(projectId, { name }));
  });

  // ============================================================
  // BOARDS
  // ============================================================

  server.tool('planka_create_board', 'Create a new board in a project', {
    projectId: z.string().describe('Project ID'),
    position: z.number().describe('Position (e.g. 65536)'),
    name: z.string().describe('Board name'),
  }, async ({ projectId, ...body }) => {
    return safeTool(() => boardsApi.createBoard(projectId, body));
  });

  server.tool('planka_get_board', 'Get a board with all its lists, cards, labels, members, tasks, and custom fields', {
    id: z.string().describe('Board ID'),
  }, async ({ id }) => {
    return safeTool(() => boardsApi.getBoard(id));
  });

  server.tool('planka_update_board', 'Update a board', {
    id: z.string().describe('Board ID'),
    position: z.number().optional(),
    name: z.string().optional(),
    defaultView: boardViewEnum.optional(),
    defaultCardType: cardTypeEnum.optional(),
    limitCardTypesToDefaultOne: z.boolean().optional(),
    alwaysDisplayCardCreator: z.boolean().optional(),
    expandTaskListsByDefault: z.boolean().optional(),
    isSubscribed: z.boolean().optional(),
  }, async ({ id, ...body }) => {
    return safeTool(() => boardsApi.updateBoard(id, body));
  });

  server.tool('planka_delete_board', 'Delete a board', {
    id: z.string().describe('Board ID'),
  }, async ({ id }) => {
    return safeTool(() => boardsApi.deleteBoard(id));
  });

  server.tool('planka_get_board_actions', 'Get activity log for a board', {
    boardId: z.string().describe('Board ID'),
    beforeId: z.string().optional().describe('Pagination: get actions before this action ID'),
  }, async ({ boardId, beforeId }) => {
    return safeTool(() => boardsApi.getBoardActions(boardId, beforeId));
  });

  server.tool('planka_add_board_member', 'Add a member to a board', {
    boardId: z.string().describe('Board ID'),
    userId: z.string().describe('User ID'),
    role: boardMemberRoleEnum.describe('Role: editor or viewer'),
    canComment: z.boolean().nullish().describe('Can comment (null = inherit from role)'),
  }, async ({ boardId, ...body }) => {
    return safeTool(() => boardsApi.createBoardMembership(boardId, body));
  });

  server.tool('planka_update_board_member', 'Update a board membership', {
    id: z.string().describe('Board membership ID'),
    role: boardMemberRoleEnum.optional(),
    canComment: z.boolean().nullish(),
  }, async ({ id, ...body }) => {
    return safeTool(() => boardsApi.updateBoardMembership(id, body));
  });

  server.tool('planka_remove_board_member', 'Remove a member from a board', {
    id: z.string().describe('Board membership ID'),
  }, async ({ id }) => {
    return safeTool(() => boardsApi.deleteBoardMembership(id));
  });

  // ============================================================
  // LISTS
  // ============================================================

  server.tool('planka_create_list', 'Create a new list in a board', {
    boardId: z.string().describe('Board ID'),
    type: listTypeEnum.describe('List type: active or closed'),
    position: z.number().describe('Position (e.g. 65536)'),
    name: z.string().describe('List name'),
  }, async ({ boardId, ...body }) => {
    return safeTool(() => listsApi.createList(boardId, body));
  });

  server.tool('planka_get_list', 'Get a list with all its cards', {
    id: z.string().describe('List ID'),
  }, async ({ id }) => {
    return safeTool(() => listsApi.getList(id));
  });

  server.tool('planka_update_list', 'Update a list (name, position, type, color, move to another board)', {
    id: z.string().describe('List ID'),
    boardId: z.string().optional().describe('Move to this board'),
    type: listTypeEnum.optional(),
    position: z.number().optional(),
    name: z.string().optional(),
    color: listColorEnum.optional(),
  }, async ({ id, ...body }) => {
    return safeTool(() => listsApi.updateList(id, body));
  });

  server.tool('planka_delete_list', 'Delete a list and all its cards', {
    id: z.string().describe('List ID'),
  }, async ({ id }) => {
    return safeTool(() => listsApi.deleteList(id));
  });

  server.tool('planka_sort_list', 'Sort cards in a list by a field', {
    id: z.string().describe('List ID'),
    fieldName: sortFieldEnum.describe('Sort by: name, dueDate, or createdAt'),
    order: sortOrderEnum.optional().describe('Sort order: asc or desc'),
  }, async ({ id, ...body }) => {
    return safeTool(() => listsApi.sortList(id, body));
  });

  server.tool('planka_move_list_cards', 'Move all cards from one list to another', {
    id: z.string().describe('Source list ID'),
    listId: z.string().describe('Destination list ID'),
  }, async ({ id, listId }) => {
    return safeTool(() => listsApi.moveListCards(id, { listId }));
  });

  server.tool('planka_clear_list', 'Clear all cards from a list (delete them)', {
    id: z.string().describe('List ID'),
  }, async ({ id }) => {
    return safeTool(() => listsApi.clearList(id));
  });

  // ============================================================
  // CARDS
  // ============================================================

  server.tool('planka_list_cards', 'List cards in a list with optional filters', {
    listId: z.string().describe('List ID'),
    search: z.string().optional().describe('Search text'),
    userIds: z.string().optional().describe('Filter by user IDs (comma-separated)'),
    labelIds: z.string().optional().describe('Filter by label IDs (comma-separated)'),
    beforeId: z.string().optional().describe('Pagination: get cards before this ID'),
  }, async ({ listId, ...params }) => {
    return safeTool(() => cardsApi.getCards(listId, params));
  });

  server.tool('planka_create_card', 'Create a new card in a list', {
    listId: z.string().describe('List ID'),
    type: cardTypeEnum.describe('Card type: project or story'),
    name: z.string().describe('Card name/title'),
    position: z.number().nullish().describe('Position (e.g. 65536)'),
    description: z.string().nullish().describe('Card description (markdown)'),
    dueDate: z.string().nullish().describe('Due date (ISO 8601)'),
    isDueCompleted: z.boolean().nullish().describe('Is due date completed'),
  }, async ({ listId, ...body }) => {
    return safeTool(() => cardsApi.createCard(listId, body));
  });

  server.tool('planka_get_card', 'Get a card with all its details (members, labels, tasks, attachments, custom fields)', {
    id: z.string().describe('Card ID'),
  }, async ({ id }) => {
    return safeTool(() => cardsApi.getCard(id));
  });

  server.tool('planka_update_card', 'Update a card (name, description, due date, move to another list/board, etc.)', {
    id: z.string().describe('Card ID'),
    boardId: z.string().optional().describe('Move to this board'),
    listId: z.string().optional().describe('Move to this list'),
    coverAttachmentId: z.string().nullish().describe('Cover attachment ID'),
    type: cardTypeEnum.optional(),
    position: z.number().nullish(),
    name: z.string().optional(),
    description: z.string().nullish(),
    dueDate: z.string().nullish().describe('Due date (ISO 8601, null to remove)'),
    isDueCompleted: z.boolean().nullish(),
    isSubscribed: z.boolean().optional(),
  }, async ({ id, ...body }) => {
    return safeTool(() => cardsApi.updateCard(id, body));
  });

  server.tool('planka_delete_card', 'Delete a card', {
    id: z.string().describe('Card ID'),
  }, async ({ id }) => {
    return safeTool(() => cardsApi.deleteCard(id));
  });

  server.tool('planka_duplicate_card', 'Duplicate a card', {
    id: z.string().describe('Card ID to duplicate'),
    boardId: z.string().optional().describe('Target board ID'),
    listId: z.string().optional().describe('Target list ID'),
    position: z.number().nullish().describe('Position in target list'),
    name: z.string().nullish().describe('Name for the duplicated card'),
  }, async ({ id, ...body }) => {
    return safeTool(() => cardsApi.duplicateCard(id, body));
  });

  server.tool('planka_read_card_notifications', 'Mark all notifications for a card as read', {
    id: z.string().describe('Card ID'),
  }, async ({ id }) => {
    return safeTool(() => cardsApi.readCardNotifications(id));
  });

  server.tool('planka_get_card_actions', 'Get activity log for a card', {
    cardId: z.string().describe('Card ID'),
    beforeId: z.string().optional().describe('Pagination: get actions before this ID'),
  }, async ({ cardId, beforeId }) => {
    return safeTool(() => cardsApi.getCardActions(cardId, beforeId));
  });

  // ============================================================
  // TASK LISTS
  // ============================================================

  server.tool('planka_create_task_list', 'Create a task list (checklist) on a card', {
    cardId: z.string().describe('Card ID'),
    position: z.number().describe('Position'),
    name: z.string().describe('Task list name'),
    showOnFrontOfCard: z.boolean().optional(),
    hideCompletedTasks: z.boolean().optional(),
  }, async ({ cardId, ...body }) => {
    return safeTool(() => taskListsApi.createTaskList(cardId, body));
  });

  server.tool('planka_get_task_list', 'Get a task list with all its tasks', {
    id: z.string().describe('Task list ID'),
  }, async ({ id }) => {
    return safeTool(() => taskListsApi.getTaskList(id));
  });

  server.tool('planka_update_task_list', 'Update a task list', {
    id: z.string().describe('Task list ID'),
    position: z.number().optional(),
    name: z.string().optional(),
    showOnFrontOfCard: z.boolean().optional(),
    hideCompletedTasks: z.boolean().optional(),
  }, async ({ id, ...body }) => {
    return safeTool(() => taskListsApi.updateTaskList(id, body));
  });

  server.tool('planka_delete_task_list', 'Delete a task list', {
    id: z.string().describe('Task list ID'),
  }, async ({ id }) => {
    return safeTool(() => taskListsApi.deleteTaskList(id));
  });

  // ============================================================
  // TASKS
  // ============================================================

  server.tool('planka_create_task', 'Create a task in a task list', {
    taskListId: z.string().describe('Task list ID'),
    position: z.number().describe('Position'),
    name: z.string().nullish().describe('Task name'),
    isCompleted: z.boolean().optional().describe('Is completed'),
    linkedCardId: z.string().optional().describe('Link to another card'),
  }, async ({ taskListId, ...body }) => {
    return safeTool(() => tasksApi.createTask(taskListId, body));
  });

  server.tool('planka_update_task', 'Update a task (name, completion, position, assignee)', {
    id: z.string().describe('Task ID'),
    taskListId: z.string().optional().describe('Move to another task list'),
    assigneeUserId: z.string().nullish().describe('Assign to user (null to unassign)'),
    position: z.number().optional(),
    name: z.string().optional(),
    isCompleted: z.boolean().optional(),
  }, async ({ id, ...body }) => {
    return safeTool(() => tasksApi.updateTask(id, body));
  });

  server.tool('planka_delete_task', 'Delete a task', {
    id: z.string().describe('Task ID'),
  }, async ({ id }) => {
    return safeTool(() => tasksApi.deleteTask(id));
  });

  // ============================================================
  // LABELS
  // ============================================================

  server.tool('planka_create_label', 'Create a label on a board', {
    boardId: z.string().describe('Board ID'),
    position: z.number().describe('Position'),
    name: z.string().nullish().describe('Label name'),
    color: labelColorEnum.describe('Label color'),
  }, async ({ boardId, ...body }) => {
    return safeTool(() => labelsApi.createLabel(boardId, body));
  });

  server.tool('planka_update_label', 'Update a label', {
    id: z.string().describe('Label ID'),
    position: z.number().optional(),
    name: z.string().nullish(),
    color: labelColorEnum.optional(),
  }, async ({ id, ...body }) => {
    return safeTool(() => labelsApi.updateLabel(id, body));
  });

  server.tool('planka_delete_label', 'Delete a label', {
    id: z.string().describe('Label ID'),
  }, async ({ id }) => {
    return safeTool(() => labelsApi.deleteLabel(id));
  });

  server.tool('planka_add_label_to_card', 'Add a label to a card', {
    cardId: z.string().describe('Card ID'),
    labelId: z.string().describe('Label ID'),
  }, async ({ cardId, labelId }) => {
    return safeTool(() => labelsApi.createCardLabel(cardId, { labelId }));
  });

  server.tool('planka_remove_label_from_card', 'Remove a label from a card', {
    cardId: z.string().describe('Card ID'),
    labelId: z.string().describe('Label ID'),
  }, async ({ cardId, labelId }) => {
    return safeTool(() => labelsApi.deleteCardLabel(cardId, labelId));
  });

  // ============================================================
  // CARD MEMBERSHIPS
  // ============================================================

  server.tool('planka_assign_user_to_card', 'Assign a user to a card', {
    cardId: z.string().describe('Card ID'),
    userId: z.string().describe('User ID'),
  }, async ({ cardId, userId }) => {
    return safeTool(() => cardMembershipsApi.createCardMembership(cardId, { userId }));
  });

  server.tool('planka_unassign_user_from_card', 'Unassign a user from a card', {
    cardId: z.string().describe('Card ID'),
    userId: z.string().describe('User ID'),
  }, async ({ cardId, userId }) => {
    return safeTool(() => cardMembershipsApi.deleteCardMembership(cardId, userId));
  });

  // ============================================================
  // COMMENTS
  // ============================================================

  server.tool('planka_list_comments', 'List comments on a card', {
    cardId: z.string().describe('Card ID'),
    beforeId: z.string().optional().describe('Pagination: get comments before this ID'),
  }, async ({ cardId, beforeId }) => {
    return safeTool(() => commentsApi.getComments(cardId, beforeId));
  });

  server.tool('planka_create_comment', 'Add a comment to a card', {
    cardId: z.string().describe('Card ID'),
    text: z.string().describe('Comment text'),
  }, async ({ cardId, text }) => {
    return safeTool(() => commentsApi.createComment(cardId, { text }));
  });

  server.tool('planka_update_comment', 'Update a comment', {
    id: z.string().describe('Comment ID'),
    text: z.string().describe('Updated comment text'),
  }, async ({ id, text }) => {
    return safeTool(() => commentsApi.updateComment(id, { text }));
  });

  server.tool('planka_delete_comment', 'Delete a comment', {
    id: z.string().describe('Comment ID'),
  }, async ({ id }) => {
    return safeTool(() => commentsApi.deleteComment(id));
  });

  // ============================================================
  // ATTACHMENTS
  // ============================================================

  server.tool('planka_add_link_attachment', 'Add a link attachment to a card', {
    cardId: z.string().describe('Card ID'),
    url: z.string().describe('URL of the link'),
    name: z.string().describe('Display name for the attachment'),
  }, async ({ cardId, url, name }) => {
    return safeTool(() => attachmentsApi.createLinkAttachment(cardId, { url, name }));
  });

  server.tool('planka_update_attachment', 'Rename an attachment', {
    id: z.string().describe('Attachment ID'),
    name: z.string().describe('New name'),
  }, async ({ id, name }) => {
    return safeTool(() => attachmentsApi.updateAttachment(id, { name }));
  });

  server.tool('planka_delete_attachment', 'Delete an attachment', {
    id: z.string().describe('Attachment ID'),
  }, async ({ id }) => {
    return safeTool(() => attachmentsApi.deleteAttachment(id));
  });

  // ============================================================
  // CUSTOM FIELDS
  // ============================================================

  server.tool('planka_update_base_custom_field_group', 'Update a base custom field group', {
    id: z.string().describe('Base custom field group ID'),
    name: z.string().describe('New name'),
  }, async ({ id, name }) => {
    return safeTool(() => customFieldsApi.updateBaseCustomFieldGroup(id, { name }));
  });

  server.tool('planka_delete_base_custom_field_group', 'Delete a base custom field group', {
    id: z.string().describe('Base custom field group ID'),
  }, async ({ id }) => {
    return safeTool(() => customFieldsApi.deleteBaseCustomFieldGroup(id));
  });

  server.tool('planka_create_custom_field_in_base_group', 'Create a custom field in a base group', {
    baseCustomFieldGroupId: z.string().describe('Base custom field group ID'),
    position: z.number().describe('Position'),
    name: z.string().describe('Field name'),
    showOnFrontOfCard: z.boolean().optional(),
  }, async ({ baseCustomFieldGroupId, ...body }) => {
    return safeTool(() => customFieldsApi.createCustomFieldInBaseGroup(baseCustomFieldGroupId, body));
  });

  server.tool('planka_create_board_custom_field_group', 'Create a custom field group on a board', {
    boardId: z.string().describe('Board ID'),
    position: z.number().describe('Position'),
    baseCustomFieldGroupId: z.string().optional().describe('Link to base group'),
    name: z.string().nullish().describe('Group name'),
  }, async ({ boardId, ...body }) => {
    return safeTool(() => customFieldsApi.createBoardCustomFieldGroup(boardId, body));
  });

  server.tool('planka_create_card_custom_field_group', 'Create a custom field group on a card', {
    cardId: z.string().describe('Card ID'),
    position: z.number().describe('Position'),
    baseCustomFieldGroupId: z.string().optional().describe('Link to base group'),
    name: z.string().nullish().describe('Group name'),
  }, async ({ cardId, ...body }) => {
    return safeTool(() => customFieldsApi.createCardCustomFieldGroup(cardId, body));
  });

  server.tool('planka_get_custom_field_group', 'Get a custom field group with its fields and values', {
    id: z.string().describe('Custom field group ID'),
  }, async ({ id }) => {
    return safeTool(() => customFieldsApi.getCustomFieldGroup(id));
  });

  server.tool('planka_update_custom_field_group', 'Update a custom field group', {
    id: z.string().describe('Custom field group ID'),
    position: z.number().optional(),
    name: z.string().nullish(),
  }, async ({ id, ...body }) => {
    return safeTool(() => customFieldsApi.updateCustomFieldGroup(id, body));
  });

  server.tool('planka_delete_custom_field_group', 'Delete a custom field group', {
    id: z.string().describe('Custom field group ID'),
  }, async ({ id }) => {
    return safeTool(() => customFieldsApi.deleteCustomFieldGroup(id));
  });

  server.tool('planka_create_custom_field_in_group', 'Create a custom field in a custom field group', {
    customFieldGroupId: z.string().describe('Custom field group ID'),
    position: z.number().describe('Position'),
    name: z.string().describe('Field name'),
    showOnFrontOfCard: z.boolean().optional(),
  }, async ({ customFieldGroupId, ...body }) => {
    return safeTool(() => customFieldsApi.createCustomFieldInGroup(customFieldGroupId, body));
  });

  server.tool('planka_update_custom_field', 'Update a custom field', {
    id: z.string().describe('Custom field ID'),
    position: z.number().optional(),
    name: z.string().optional(),
    showOnFrontOfCard: z.boolean().optional(),
  }, async ({ id, ...body }) => {
    return safeTool(() => customFieldsApi.updateCustomField(id, body));
  });

  server.tool('planka_delete_custom_field', 'Delete a custom field', {
    id: z.string().describe('Custom field ID'),
  }, async ({ id }) => {
    return safeTool(() => customFieldsApi.deleteCustomField(id));
  });

  server.tool('planka_update_custom_field_value', 'Set a custom field value on a card', {
    cardId: z.string().describe('Card ID'),
    customFieldGroupId: z.string().describe('Custom field group ID'),
    customFieldId: z.string().describe('Custom field ID'),
    content: z.string().describe('Field value content'),
  }, async ({ cardId, customFieldGroupId, customFieldId, content }) => {
    return safeTool(() =>
      customFieldsApi.updateCustomFieldValue(cardId, customFieldGroupId, customFieldId, { content }),
    );
  });

  server.tool('planka_delete_custom_field_value', 'Delete a custom field value from a card', {
    cardId: z.string().describe('Card ID'),
    customFieldGroupId: z.string().describe('Custom field group ID'),
    customFieldId: z.string().describe('Custom field ID'),
  }, async ({ cardId, customFieldGroupId, customFieldId }) => {
    return safeTool(() =>
      customFieldsApi.deleteCustomFieldValue(cardId, customFieldGroupId, customFieldId),
    );
  });

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  server.tool('planka_list_notifications', 'List all notifications for the current user', {}, async () => {
    return safeTool(() => notificationsApi.getNotifications());
  });

  server.tool('planka_get_notification', 'Get a notification by ID', {
    id: z.string().describe('Notification ID'),
  }, async ({ id }) => {
    return safeTool(() => notificationsApi.getNotification(id));
  });

  server.tool('planka_update_notification', 'Mark a notification as read or unread', {
    id: z.string().describe('Notification ID'),
    isRead: z.boolean().describe('Mark as read (true) or unread (false)'),
  }, async ({ id, isRead }) => {
    return safeTool(() => notificationsApi.updateNotification(id, { isRead }));
  });

  server.tool('planka_read_all_notifications', 'Mark all notifications as read', {}, async () => {
    return safeTool(() => notificationsApi.readAllNotifications());
  });

  // ============================================================
  // NOTIFICATION SERVICES
  // ============================================================

  server.tool('planka_create_board_notification_service', 'Create a notification service (webhook) for a board', {
    boardId: z.string().describe('Board ID'),
    url: z.string().describe('Webhook URL'),
    format: notifFormatEnum.describe('Message format'),
  }, async ({ boardId, ...body }) => {
    return safeTool(() => notificationServicesApi.createBoardNotificationService(boardId, body));
  });

  server.tool('planka_create_user_notification_service', 'Create a notification service (webhook) for a user', {
    userId: z.string().describe('User ID'),
    url: z.string().describe('Webhook URL'),
    format: notifFormatEnum.describe('Message format'),
  }, async ({ userId, ...body }) => {
    return safeTool(() => notificationServicesApi.createUserNotificationService(userId, body));
  });

  server.tool('planka_update_notification_service', 'Update a notification service', {
    id: z.string().describe('Notification service ID'),
    url: z.string().optional(),
    format: notifFormatEnum.optional(),
  }, async ({ id, ...body }) => {
    return safeTool(() => notificationServicesApi.updateNotificationService(id, body));
  });

  server.tool('planka_delete_notification_service', 'Delete a notification service', {
    id: z.string().describe('Notification service ID'),
  }, async ({ id }) => {
    return safeTool(() => notificationServicesApi.deleteNotificationService(id));
  });

  server.tool('planka_test_notification_service', 'Send a test message to a notification service', {
    id: z.string().describe('Notification service ID'),
  }, async ({ id }) => {
    return safeTool(() => notificationServicesApi.testNotificationService(id));
  });

  // ============================================================
  // WEBHOOKS
  // ============================================================

  server.tool('planka_list_webhooks', 'List all webhooks', {}, async () => {
    return safeTool(() => webhooksApi.getWebhooks());
  });

  server.tool('planka_create_webhook', 'Create a webhook', {
    name: z.string().describe('Webhook name'),
    url: z.string().describe('Webhook URL'),
    accessToken: z.string().nullish().describe('Access token for authentication'),
    events: z.string().nullish().describe('Comma-separated list of events to subscribe to'),
    excludedEvents: z.string().nullish().describe('Comma-separated list of events to exclude'),
  }, async (args) => {
    return safeTool(() => webhooksApi.createWebhook(args));
  });

  server.tool('planka_update_webhook', 'Update a webhook', {
    id: z.string().describe('Webhook ID'),
    name: z.string().optional(),
    url: z.string().optional(),
    accessToken: z.string().nullish(),
    events: z.string().nullish(),
    excludedEvents: z.string().nullish(),
  }, async ({ id, ...body }) => {
    return safeTool(() => webhooksApi.updateWebhook(id, body));
  });

  server.tool('planka_delete_webhook', 'Delete a webhook', {
    id: z.string().describe('Webhook ID'),
  }, async ({ id }) => {
    return safeTool(() => webhooksApi.deleteWebhook(id));
  });

  // ============================================================
  // COMPOSITE TOOLS (aggregate multiple API calls)
  // ============================================================

  server.tool('planka_get_board_overview', 'Get a complete board overview: board info, lists, cards, members, labels, tasks', {
    id: z.string().describe('Board ID'),
  }, async ({ id }) => {
    return safeTool(async () => {
      const data = (await boardsApi.getBoard(id)) as Record<string, unknown>;
      if (data && typeof data === 'object' && 'error' in data) return data;

      const board = data.item as Record<string, unknown>;
      const included = (data.included || {}) as Record<string, unknown[]>;

      const lists = (included.lists || []) as Array<{ id: string; name: string; position: number }>;
      const cards = (included.cards || []) as Array<{ id: string; listId: string; name: string; position: number }>;

      // Build a structured overview
      const listsWithCards = lists
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((list) => ({
          ...list,
          cards: cards
            .filter((c) => c.listId === list.id)
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
        }));

      return {
        board,
        lists: listsWithCards,
        members: included.users || [],
        boardMemberships: included.boardMemberships || [],
        labels: included.labels || [],
        taskLists: included.taskLists || [],
        tasks: included.tasks || [],
        attachments: included.attachments || [],
        customFieldGroups: included.customFieldGroups || [],
        customFields: included.customFields || [],
        customFieldValues: included.customFieldValues || [],
      };
    });
  });

  server.tool('planka_get_project_overview', 'Get a project overview with boards and card counts per list', {
    id: z.string().describe('Project ID'),
  }, async ({ id }) => {
    return safeTool(async () => {
      const projectData = (await projectsApi.getProject(id)) as Record<string, unknown>;
      if (projectData && typeof projectData === 'object' && 'error' in projectData) return projectData;

      const project = projectData.item as Record<string, unknown>;
      const included = (projectData.included || {}) as Record<string, unknown[]>;
      const boards = (included.boards || []) as Array<{ id: string; name: string; position: number }>;

      // For each board, get details
      const boardOverviews = await Promise.all(
        boards.map(async (b) => {
          const boardData = (await boardsApi.getBoard(b.id)) as Record<string, unknown>;
          if (boardData && typeof boardData === 'object' && 'error' in boardData) {
            return { board: b, error: true };
          }
          const bIncluded = (boardData.included || {}) as Record<string, unknown[]>;
          const lists = (bIncluded.lists || []) as Array<{ id: string; name: string; position: number }>;
          const cards = (bIncluded.cards || []) as Array<{ id: string; listId: string }>;

          return {
            board: boardData.item,
            lists: lists.map((l) => ({
              id: l.id,
              name: l.name,
              position: l.position,
              cardCount: cards.filter((c) => c.listId === l.id).length,
            })),
            totalCards: cards.length,
          };
        }),
      );

      return { project, boards: boardOverviews };
    });
  });

  server.tool('planka_search_cards_in_project', 'Search for cards across all boards in a project', {
    projectId: z.string().describe('Project ID'),
    search: z.string().describe('Search text'),
  }, async ({ projectId, search }) => {
    return safeTool(async () => {
      // Get project to list boards
      const projectData = (await projectsApi.getProject(projectId)) as Record<string, unknown>;
      if (projectData && typeof projectData === 'object' && 'error' in projectData) return projectData;

      const included = (projectData.included || {}) as Record<string, unknown[]>;
      const boards = (included.boards || []) as Array<{ id: string; name: string }>;
      const results: Array<{ board: string; boardId: string; cards: unknown[] }> = [];

      for (const board of boards) {
        // Get board to find lists
        const boardData = (await boardsApi.getBoard(board.id)) as Record<string, unknown>;
        if (boardData && typeof boardData === 'object' && 'error' in boardData) continue;
        const bIncluded = (boardData.included || {}) as Record<string, unknown[]>;
        const lists = (bIncluded.lists || []) as Array<{ id: string }>;

        for (const list of lists) {
          const cardsData = (await cardsApi.getCards(list.id, { search })) as Record<string, unknown>;
          if (cardsData && typeof cardsData === 'object' && 'error' in cardsData) continue;
          const items = ((cardsData as { items?: unknown[] }).items || []) as unknown[];
          if (items.length > 0) {
            results.push({ board: board.name, boardId: board.id, cards: items });
          }
        }
      }

      return { projectId, search, results, totalMatches: results.reduce((s, r) => s + r.cards.length, 0) };
    });
  });

  server.tool('planka_get_my_cards', 'Get all cards assigned to a specific user across all projects', {
    userId: z.string().describe('User ID to find cards for'),
  }, async ({ userId }) => {
    return safeTool(async () => {
      const projectsData = (await projectsApi.getProjects()) as Record<string, unknown>;
      if (projectsData && typeof projectsData === 'object' && 'error' in projectsData) return projectsData;

      const pIncluded = (projectsData.included || {}) as Record<string, unknown[]>;
      const boards = (pIncluded.boards || []) as Array<{ id: string; name: string; projectId: string }>;
      const projects = ((projectsData as { items?: unknown[] }).items || []) as Array<{ id: string; name: string }>;

      const projectMap = new Map(projects.map((p) => [p.id, p.name]));
      const results: Array<{ project: string; board: string; boardId: string; cards: unknown[] }> = [];

      for (const board of boards) {
        const boardData = (await boardsApi.getBoard(board.id)) as Record<string, unknown>;
        if (boardData && typeof boardData === 'object' && 'error' in boardData) continue;
        const bIncluded = (boardData.included || {}) as Record<string, unknown[]>;
        const cards = (bIncluded.cards || []) as Array<{ id: string }>;
        const memberships = (bIncluded.cardMemberships || []) as Array<{ cardId: string; userId: string }>;

        const userCardIds = new Set(memberships.filter((m) => m.userId === userId).map((m) => m.cardId));
        const userCards = cards.filter((c) => userCardIds.has(c.id));

        if (userCards.length > 0) {
          results.push({
            project: projectMap.get(board.projectId) || board.projectId,
            board: board.name,
            boardId: board.id,
            cards: userCards,
          });
        }
      }

      return { userId, results, totalCards: results.reduce((s, r) => s + r.cards.length, 0) };
    });
  });

  return server;
}
