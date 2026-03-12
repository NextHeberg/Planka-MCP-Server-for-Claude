import express from 'express';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from './server.js';
import { plankaClient } from './planka/client.js';

const PORT = Number(process.env.PORT) || 3001;

async function main() {
  // Authenticate with Planka at startup (fail fast)
  await plankaClient.login();

  const app = express();
  app.use(express.json());

  // CORS — required for Claude.ai cloud connector
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id, last-event-id');
    res.header('Access-Control-Expose-Headers', 'mcp-session-id');
    if (_req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

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

  // MCP endpoint — Streamable HTTP
  app.post('/mcp', async (req, res) => {
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
  app.get('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !sessions.has(sessionId)) {
      res.status(400).json({ error: 'Invalid or missing session ID' });
      return;
    }
    const session = sessions.get(sessionId)!;
    await session.transport.handleRequest(req, res);
  });

  // DELETE /mcp — Close session
  app.delete('/mcp', async (req, res) => {
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
