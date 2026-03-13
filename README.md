# Planka MCP Server for Claude

MCP (Model Context Protocol) server that connects [Planka](https://planka.app/) kanban boards to Claude.ai for AI-powered project management.

This server exposes **all** Planka v2 API operations as MCP tools via the **Streamable HTTP** transport, making it compatible with Claude.ai custom connectors.

## Features

- **75+ MCP tools** covering every Planka API endpoint
- **Streamable HTTP transport** (`POST /mcp` + `GET /mcp` SSE) for Claude.ai compatibility
- **Dual authentication**: API key (recommended) or email/password with auto-refresh on 401
- **Composite tools**: board overview, project overview, cross-project card search, "my cards"
- **Multi-session support**: each Claude conversation gets its own MCP session
- **Docker ready**: multi-stage Dockerfile + docker-compose

## Prerequisites

- Node.js 20+
- A running Planka v2.x instance
- A **dedicated Planka account for Claude** (see below)
- A **publicly accessible domain** for the MCP server (e.g. `https://planka-mcp.domain.tld`)

## Quick Start

### 1. Create a dedicated Planka account for Claude

We strongly recommend creating a **dedicated Planka user account** specifically for Claude (e.g. `claude@yourdomain.tld`), rather than using your personal account. This makes it easy to:

- Track exactly which actions Claude performed in the activity log
- Revoke Claude's access independently without affecting your own account
- Apply specific permissions (admin or member) scoped to Claude's needs

### 2. Install dependencies

```bash
npm install
```

### 3. Configure

```bash
cp .env.example .env
# Edit .env with your Planka URL and Claude's dedicated account credentials
```

**Authentication options** (pick one):

| Method | Variables | Notes |
|--------|-----------|-------|
| API Key (recommended) | `PLANKA_API_KEY` | Never expires. Generate via `planka_create_user_api_key` tool |
| Email + Password | `PLANKA_EMAIL` + `PLANKA_PASSWORD` | Auto-refreshes JWT on 401 |

### 4. Expose the server on a public domain

Claude.ai requires the MCP server to be accessible over HTTPS. You need a **public domain** pointing to this server, for example:

```
https://planka-mcp.domain.tld
```

Configure your reverse proxy (Nginx, Traefik, Caddy…) to forward HTTPS traffic to `localhost:3001`.

### 5. Build and run

```bash
npm run build
npm start
```

### 6. Verify

```bash
curl https://planka-mcp.domain.tld/health
# {"status":"ok","planka_url":"http://...","version":"1.0.0"}
```

### 7. Add to Claude.ai

1. Go to **Settings** > **Connectors** > **Add custom connector**
2. Set the URL to: `https://planka-mcp.domain.tld/mcp`

   > ⚠️ The URL **must include `/mcp`** at the end — Claude.ai will not find the MCP server without it.

3. Click **Add**, then **Connect** and authorize via the OAuth screen
4. Enable the connector in a conversation via the **"+"** button > **Connectors**

## Docker

```bash
# Build and run
docker compose up -d

# Check logs
docker compose logs -f planka-mcp
```

## Security

Even though the MCP server is exposed on a public domain, it is effectively inaccessible to anyone except Claude. Here's why:

- **OAuth required** — without completing the OAuth flow (which opens an interactive popup in your browser), no one can obtain a valid token. This flow cannot be automated without human interaction.
- **Tokens stored in memory only** — issued tokens live exclusively in the container's RAM. A container restart invalidates all existing tokens immediately. No database, no persistent storage exposed.
- **No token = 401** — any direct request to `/mcp` without a valid Bearer token is rejected immediately.
- **Tokens are unguessable** — format `planka-mcp-token-{uuid}`, with UUID v4 providing 2¹²² possible values.

The only realistic attack surface is token interception in transit — mitigated entirely by HTTPS/TLS. The OAuth discovery endpoints (`/.well-known/*`, `/oauth/authorize`, `/oauth/token`) are public but grant no access without completing the interactive flow.

In practice: only Claude — after **you** have clicked "Authorize" — can use this server.

## Cost — Using Claude Haiku

Managing Planka tasks (creating cards, updating lists, searching boards…) does **not** require a powerful model. These are structured, low-complexity operations that work perfectly with **Claude Haiku**, Anthropic's fastest and most affordable model.

Using Claude Haiku for Planka operations costs a fraction of Claude Sonnet or Opus — making this connector extremely cost-effective for day-to-day project management automation.

## Development

```bash
npm run dev   # Uses tsx --watch for hot reload
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PLANKA_BASE_URL` | Yes | - | Full URL to Planka (e.g. `http://192.168.1.50:3000`) |
| `PLANKA_API_KEY` | One of | - | API key for authentication |
| `PLANKA_EMAIL` | One of | - | Email for password auth |
| `PLANKA_PASSWORD` | One of | - | Password for password auth |
| `PORT` | No | `3001` | Server listen port |
| `NODE_TLS_REJECT_UNAUTHORIZED` | No | `true` | Set to `false` for self-signed certs |
| `PLANKA_REQUEST_TIMEOUT` | No | `30000` | Request timeout in ms |
| `LOG_LEVEL` | No | `info` | Log level: error, warn, info, debug |

## Available MCP Tools (75+)

### Auth & System
| Tool | Description |
|------|-------------|
| `planka_get_bootstrap` | Get Planka instance info (version, OIDC, limits) |
| `planka_get_config` | Get SMTP configuration (admin) |
| `planka_update_config` | Update SMTP configuration (admin) |
| `planka_test_smtp` | Test SMTP configuration (admin) |

### Users
| Tool | Description |
|------|-------------|
| `planka_list_users` | List all users |
| `planka_create_user` | Create a new user |
| `planka_get_user` | Get user details |
| `planka_update_user` | Update user settings |
| `planka_delete_user` | Delete a user |
| `planka_update_user_email` | Change user email |
| `planka_update_user_password` | Change user password |
| `planka_update_user_username` | Change username |
| `planka_create_user_api_key` | Generate API key |

### Projects
| Tool | Description |
|------|-------------|
| `planka_list_projects` | List all projects |
| `planka_create_project` | Create a project |
| `planka_get_project` | Get project with boards and members |
| `planka_update_project` | Update project settings |
| `planka_delete_project` | Delete a project |
| `planka_add_project_manager` | Add a project manager |
| `planka_remove_project_manager` | Remove a project manager |
| `planka_create_base_custom_field_group` | Create base custom field group |

### Boards
| Tool | Description |
|------|-------------|
| `planka_create_board` | Create a board |
| `planka_get_board` | Get board with all content |
| `planka_update_board` | Update board settings |
| `planka_delete_board` | Delete a board |
| `planka_get_board_actions` | Get board activity log |
| `planka_add_board_member` | Add board member |
| `planka_update_board_member` | Update member role |
| `planka_remove_board_member` | Remove board member |

### Lists
| Tool | Description |
|------|-------------|
| `planka_create_list` | Create a list |
| `planka_get_list` | Get list with cards |
| `planka_update_list` | Update list (name, color, position, move) |
| `planka_delete_list` | Delete a list |
| `planka_sort_list` | Sort cards in a list |
| `planka_move_list_cards` | Move all cards to another list |
| `planka_clear_list` | Clear all cards from a list |

### Cards
| Tool | Description |
|------|-------------|
| `planka_list_cards` | List cards with filters |
| `planka_create_card` | Create a card |
| `planka_get_card` | Get card with all details |
| `planka_update_card` | Update card (move, rename, due date, etc.) |
| `planka_delete_card` | Delete a card |
| `planka_duplicate_card` | Duplicate a card |
| `planka_read_card_notifications` | Mark card notifications read |
| `planka_get_card_actions` | Get card activity log |

### Task Lists & Tasks
| Tool | Description |
|------|-------------|
| `planka_create_task_list` | Create a checklist on a card |
| `planka_get_task_list` | Get task list with tasks |
| `planka_update_task_list` | Update task list |
| `planka_delete_task_list` | Delete task list |
| `planka_create_task` | Create a task |
| `planka_update_task` | Update task (complete, assign, rename) |
| `planka_delete_task` | Delete a task |

### Labels
| Tool | Description |
|------|-------------|
| `planka_create_label` | Create a label |
| `planka_update_label` | Update a label |
| `planka_delete_label` | Delete a label |
| `planka_add_label_to_card` | Add label to card |
| `planka_remove_label_from_card` | Remove label from card |

### Card Members
| Tool | Description |
|------|-------------|
| `planka_assign_user_to_card` | Assign user to card |
| `planka_unassign_user_from_card` | Unassign user from card |

### Comments
| Tool | Description |
|------|-------------|
| `planka_list_comments` | List card comments |
| `planka_create_comment` | Add a comment |
| `planka_update_comment` | Edit a comment |
| `planka_delete_comment` | Delete a comment |

### Attachments
| Tool | Description |
|------|-------------|
| `planka_add_link_attachment` | Add a link attachment |
| `planka_update_attachment` | Rename attachment |
| `planka_delete_attachment` | Delete attachment |

### Custom Fields
| Tool | Description |
|------|-------------|
| `planka_update_base_custom_field_group` | Update base field group |
| `planka_delete_base_custom_field_group` | Delete base field group |
| `planka_create_custom_field_in_base_group` | Create field in base group |
| `planka_create_board_custom_field_group` | Create board field group |
| `planka_create_card_custom_field_group` | Create card field group |
| `planka_get_custom_field_group` | Get field group |
| `planka_update_custom_field_group` | Update field group |
| `planka_delete_custom_field_group` | Delete field group |
| `planka_create_custom_field_in_group` | Create field in group |
| `planka_update_custom_field` | Update a custom field |
| `planka_delete_custom_field` | Delete a custom field |
| `planka_update_custom_field_value` | Set field value on card |
| `planka_delete_custom_field_value` | Remove field value from card |

### Notifications
| Tool | Description |
|------|-------------|
| `planka_list_notifications` | List all notifications |
| `planka_get_notification` | Get notification details |
| `planka_update_notification` | Mark read/unread |
| `planka_read_all_notifications` | Mark all as read |

### Notification Services
| Tool | Description |
|------|-------------|
| `planka_create_board_notification_service` | Create board webhook |
| `planka_create_user_notification_service` | Create user webhook |
| `planka_update_notification_service` | Update notification service |
| `planka_delete_notification_service` | Delete notification service |
| `planka_test_notification_service` | Test notification service |

### Webhooks
| Tool | Description |
|------|-------------|
| `planka_list_webhooks` | List all webhooks |
| `planka_create_webhook` | Create a webhook |
| `planka_update_webhook` | Update a webhook |
| `planka_delete_webhook` | Delete a webhook |

### Composite Tools
| Tool | Description |
|------|-------------|
| `planka_get_board_overview` | Full board view: lists + cards + members + labels |
| `planka_get_project_overview` | Project with boards and card counts per list |
| `planka_search_cards_in_project` | Search cards across all boards in a project |
| `planka_get_my_cards` | Get all cards assigned to a user across all projects |

## Usage Examples (natural language in Claude)

- "Show me all my projects"
- "Create a new project called 'Website Redesign'"
- "What cards are assigned to me?"
- "Add a card 'Fix login bug' to the 'To Do' list on the Dev board"
- "Move all cards from 'In Progress' to 'Done'"
- "Search for cards mentioning 'database' in the Backend project"
- "Create a checklist on card X with items: design, implement, test"
- "Set the due date for card Y to next Friday"
- "Add a comment on card Z: 'This is ready for review'"
- "Show me the activity log for the main board"

## Architecture

```
src/
  index.ts                  # Express HTTP server (Streamable HTTP transport)
  server.ts                 # MCP server definition + all 75+ tools
  planka/
    client.ts               # HTTP client (auth, auto-refresh, timeout)
    types.ts                # Full TypeScript type definitions
    api/
      auth.ts               # Access tokens + bootstrap
      projects.ts           # Projects + managers
      boards.ts             # Boards + memberships
      lists.ts              # Lists (CRUD + sort + move + clear)
      cards.ts              # Cards (CRUD + duplicate + notifications)
      task-lists.ts         # Task lists
      tasks.ts              # Tasks
      labels.ts             # Labels + card labels
      card-memberships.ts   # Card member assignments
      comments.ts           # Comments
      attachments.ts        # Attachments (link type)
      custom-fields.ts      # Custom field groups + fields + values
      users.ts              # Users (CRUD + email/password/username/apikey)
      notifications.ts      # Notifications
      notification-services.ts  # Notification services
      webhooks.ts           # Webhooks
      config.ts             # SMTP config
```

## License

GPL-3.0 license
