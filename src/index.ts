import express from 'express';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from './server.js';
import { plankaClient } from './planka/client.js';

const PORT = Number(process.env.PORT) || 3001;
const ISSUER = process.env.OAUTH_ISSUER || 'https://planka-mcp.nextheberg.com';

async function main() {
  // Authenticate with Planka at startup (fail fast)
  await plankaClient.login();

  const app = express();
  app.use(express.json());

  // CORS — required for Claude.ai cloud connector
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcp-session-id, last-event-id');
    res.header('Access-Control-Expose-Headers', 'mcp-session-id');
    if (_req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // --- OAuth 2.0 passthrough for Claude.ai custom connectors ---

  // In-memory store for authorization codes
  const authCodes = new Map<string, { redirect_uri: string; code_challenge: string }>();
  const issuedTokens = new Set<string>();

  // 1. OAuth Authorization Server Metadata
  app.get('/.well-known/oauth-authorization-server', (_req, res) => {
    res.json({
      issuer: ISSUER,
      authorization_endpoint: `${ISSUER}/oauth/authorize`,
      token_endpoint: `${ISSUER}/oauth/token`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code'],
      code_challenge_methods_supported: ['S256'],
    });
  });

  // 2. Authorization endpoint — show consent page
  app.get('/oauth/authorize', (req, res) => {
    const { redirect_uri, state, code_challenge, client_id } = req.query as Record<string, string>;
    if (!redirect_uri || !state) {
      res.status(400).json({ error: 'Missing redirect_uri or state' });
      return;
    }
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Planka MCP – Authorize</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center;
           justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
    .card { background: white; border-radius: 12px; padding: 2rem; max-width: 400px;
            width: 90%; box-shadow: 0 4px 24px rgba(0,0,0,0.1); text-align: center; }
    .logo { font-size: 2rem; margin-bottom: 1rem; }
    h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
    p { color: #666; font-size: 0.9rem; margin: 0 0 1.5rem; }
    button { background: #2563eb; color: white; border: none; border-radius: 8px;
             padding: 0.75rem 2rem; font-size: 1rem; cursor: pointer; width: 100%; }
    button:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🔌</div>
    <h1>Connect to Planka MCP</h1>
    <p>Claude is requesting access to manage your Planka boards and projects.</p>
    <form method="POST" action="/oauth/authorize">
      <input type="hidden" name="redirect_uri" value="${redirect_uri}">
      <input type="hidden" name="state" value="${state}">
      <input type="hidden" name="code_challenge" value="${code_challenge || ''}">
      <input type="hidden" name="client_id" value="${client_id || ''}">
      <button type="submit">Authorize Access</button>
    </form>
  </div>
</body>
</html>`);
  });

  // 2b. Authorization endpoint — handle consent form submission
  app.post('/oauth/authorize', express.urlencoded({ extended: false }), (req, res) => {
    const { redirect_uri, state, code_challenge, client_id: _clientId } = req.body ?? {};
    if (!redirect_uri || !state) {
      res.status(400).json({ error: 'Missing redirect_uri or state' });
      return;
    }
    const code = randomUUID();
    authCodes.set(code, { redirect_uri, code_challenge: code_challenge || '' });
    const url = new URL(redirect_uri);
    url.searchParams.set('code', code);
    url.searchParams.set('state', state);
    res.redirect(url.toString());
  });

  // 3. Token endpoint — exchange code for access token
  app.post('/oauth/token', (req, res) => {
    const { code, redirect_uri: _ruri, code_verifier: _verifier, client_id: _clientId, grant_type: _gt } = req.body ?? {};
    if (!code || !authCodes.has(code)) {
      res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid or expired authorization code' });
      return;
    }
    authCodes.delete(code);
    const token = `planka-mcp-token-${randomUUID()}`;
    issuedTokens.add(token);
    res.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 86400,
    });
  });

  // 4. OAuth Protected Resource Metadata
  app.get('/.well-known/oauth-protected-resource', (_req, res) => {
    res.json({
      resource: ISSUER,
      authorization_servers: [ISSUER],
      bearer_methods_supported: ['header'],
    });
  });

  // --- end OAuth ---

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      planka_url: process.env.PLANKA_BASE_URL,
      version: '1.0.0',
    });
  });

  // Store transports by session ID for multi-session support
  const sessions = new Map<string, { transport: StreamableHTTPServerTransport }>();

  // Auth middleware for /mcp — require a valid OAuth token
  const mcpAuth: express.RequestHandler = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.setHeader(
        'WWW-Authenticate',
        `Bearer realm="planka-mcp", resource_metadata="${ISSUER}/.well-known/oauth-protected-resource"`
      );
      res.status(401).json({ error: 'unauthorized', message: 'Authentication required' });
      return;
    }

    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match || !issuedTokens.has(match[1])) {
      res.status(401).json({ error: 'invalid_token', message: 'Invalid or expired token' });
      return;
    }

    next();
  };

  // MCP endpoint — Streamable HTTP
  app.post('/mcp', mcpAuth, async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    // If we have a session ID, reuse the existing transport
    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId)!;
      await session.transport.handleRequest(req, res, req.body);
      return;
    }

    // Check if this is an initialize request (new session)
    const body = req.body;
    if (body && body.method === 'initialize') {
      const newSessionId = randomUUID();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => newSessionId,
        onsessioninitialized: (sid) => {
          console.error(`[mcp] New session initialized: ${sid}`);
        },
      });

      const server = createMcpServer();
      await server.connect(transport);

      sessions.set(newSessionId, { transport });

      // Clean up on close
      transport.onclose = () => {
        console.error(`[mcp] Session closed: ${newSessionId}`);
        sessions.delete(newSessionId);
      };

      await transport.handleRequest(req, res, body);
      return;
    }

    // No session and not an initialize request
    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Bad Request: No valid session. Send an initialize request first.' },
      id: body?.id ?? null,
    });
  });

  // GET /mcp — SSE stream for server-to-client notifications
  app.get('/mcp', mcpAuth, async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !sessions.has(sessionId)) {
      res.status(400).json({ error: 'Invalid or missing session ID' });
      return;
    }
    const session = sessions.get(sessionId)!;
    await session.transport.handleRequest(req, res);
  });

  // DELETE /mcp — Close session
  app.delete('/mcp', mcpAuth, async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !sessions.has(sessionId)) {
      res.status(400).json({ error: 'Invalid or missing session ID' });
      return;
    }
    const session = sessions.get(sessionId)!;
    await session.transport.handleRequest(req, res);
    sessions.delete(sessionId);
  });

  app.listen(PORT, () => {
    console.error(`[planka-mcp] Server running on port ${PORT}`);
    console.error(`[planka-mcp] MCP endpoint: POST http://localhost:${PORT}/mcp`);
    console.error(`[planka-mcp] Health check: GET http://localhost:${PORT}/health`);
    console.error(`[planka-mcp] Planka URL: ${process.env.PLANKA_BASE_URL}`);
  });
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
