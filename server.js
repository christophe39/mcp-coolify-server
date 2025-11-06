import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

const app = express();
app.use(express.json());

const COOLIFY_API_URL = process.env.COOLIFY_API_URL || 'http://coolify:3000/api/v1';
const COOLIFY_TOKEN = process.env.COOLIFY_TOKEN;
const MCP_SECRET = process.env.MCP_SECRET;

const server = new Server({
  name: 'coolify-mcp',
  version: '1.0.0',
}, {
  capabilities: { tools: {} },
});

server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'coolify_list_apps',
        description: 'Liste toutes les applications Coolify',
      },
      {
        name: 'coolify_get_app',
        description: 'Récupère les détails d\'une application',
        inputSchema: {
          type: 'object',
          properties: {
            appId: { type: 'string', description: 'ID de l\'application' }
          },
          required: ['appId']
        }
      }
    ],
  };
});

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  const headers = {
    'Authorization': `Bearer ${COOLIFY_TOKEN}`,
    'Content-Type': 'application/json',
  };
  
  if (name === 'coolify_list_apps') {
    const res = await fetch(`${COOLIFY_API_URL}/applications`, { headers });
    const data = await res.json();
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
  
  if (name === 'coolify_get_app') {
    const res = await fetch(`${COOLIFY_API_URL}/applications/${args.appId}`, { headers });
    const data = await res.json();
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
  
  throw new Error(`Outil inconnu: ${name}`);
});

app.get('/sse', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${MCP_SECRET}`) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  
  const transport = new SSEServerTransport('/message', res);
  await server.connect(transport);
});

app.post('/message', (req, res) => {
  res.status(200).send();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MCP Server démarré sur le port ${PORT}`);
});
