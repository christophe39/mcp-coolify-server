import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const app = express();
app.use(express.json());

// Configuration
const COOLIFY_API_URL = process.env.COOLIFY_API_URL || 'http://coolify:3000/api/v1';
const COOLIFY_TOKEN = process.env.COOLIFY_TOKEN;
const NOCODB_API_URL = process.env.NOCODB_API_URL || 'https://nocodb.agnisolution.fr';
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;
const MCP_SECRET = process.env.MCP_SECRET;

const server = new Server({
  name: 'agnisolution-mcp',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

// Liste des outils disponibles
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // === COOLIFY TOOLS ===
      {
        name: 'coolify_list_apps',
        description: 'Liste toutes les applications Coolify déployées',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'coolify_get_app',
        description: 'Récupère les détails d\'une application Coolify',
        inputSchema: {
          type: 'object',
          properties: {
            appId: {
              type: 'string',
              description: 'ID de l\'application',
            },
          },
          required: ['appId'],
        },
      },
      {
        name: 'coolify_deploy_app',
        description: 'Déclenche le déploiement d\'une application',
        inputSchema: {
          type: 'object',
          properties: {
            appId: {
              type: 'string',
              description: 'ID de l\'application à déployer',
            },
          },
          required: ['appId'],
        },
      },
      
      // === NOCODB TOOLS ===
      {
        name: 'nocodb_list_bases',
        description: 'Liste toutes les bases de données NocoDB',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'nocodb_list_tables',
        description: 'Liste les tables d\'une base NocoDB',
        inputSchema: {
          type: 'object',
          properties: {
            baseId: {
              type: 'string',
              description: 'ID de la base',
            },
          },
          required: ['baseId'],
        },
      },
      {
        name: 'nocodb_get_records',
        description: 'Récupère les enregistrements d\'une table',
        inputSchema: {
          type: 'object',
          properties: {
            baseId: {
              type: 'string',
              description: 'ID de la base',
            },
            tableName: {
              type: 'string',
              description: 'Nom de la table',
            },
            limit: {
              type: 'number',
              description: 'Nombre maximum d\'enregistrements (défaut: 25)',
              default: 25,
            },
          },
          required: ['baseId', 'tableName'],
        },
      },
      {
        name: 'nocodb_create_record',
        description: 'Crée un nouvel enregistrement dans une table',
        inputSchema: {
          type: 'object',
          properties: {
            baseId: {
              type: 'string',
              description: 'ID de la base',
            },
            tableName: {
              type: 'string',
              description: 'Nom de la table',
            },
            data: {
              type: 'object',
              description: 'Données de l\'enregistrement',
            },
          },
          required: ['baseId', 'tableName', 'data'],
        },
      },
      {
        name: 'nocodb_update_record',
        description: 'Met à jour un enregistrement existant',
        inputSchema: {
          type: 'object',
          properties: {
            baseId: {
              type: 'string',
              description: 'ID de la base',
            },
            tableName: {
              type: 'string',
              description: 'Nom de la table',
            },
            recordId: {
              type: 'string',
              description: 'ID de l\'enregistrement',
            },
            data: {
              type: 'object',
              description: 'Données à mettre à jour',
            },
          },
          required: ['baseId', 'tableName', 'recordId', 'data'],
        },
      },
      {
        name: 'nocodb_delete_record',
        description: 'Supprime un enregistrement',
        inputSchema: {
          type: 'object',
          properties: {
            baseId: {
              type: 'string',
              description: 'ID de la base',
            },
            tableName: {
              type: 'string',
              description: 'Nom de la table',
            },
            recordId: {
              type: 'string',
              description: 'ID de l\'enregistrement',
            },
          },
          required: ['baseId', 'tableName', 'recordId'],
        },
      },
    ],
  };
});

// Gestion des appels d'outils
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    // === COOLIFY TOOLS ===
    if (name === 'coolify_list_apps') {
      const res = await fetch(`${COOLIFY_API_URL}/applications`, {
        headers: {
          'Authorization': `Bearer ${COOLIFY_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
    
    if (name === 'coolify_get_app') {
      const res = await fetch(`${COOLIFY_API_URL}/applications/${args.appId}`, {
        headers: {
          'Authorization': `Bearer ${COOLIFY_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
    
    if (name === 'coolify_deploy_app') {
      const res = await fetch(`${COOLIFY_API_URL}/applications/${args.appId}/deploy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${COOLIFY_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      return {
        content: [
          {
            type: 'text',
            text: `Déploiement lancé pour l'application ${args.appId}`,
          },
        ],
      };
    }
    
    // === NOCODB TOOLS ===
    if (name === 'nocodb_list_bases') {
      const res = await fetch(`${NOCODB_API_URL}/api/v1/db/meta/projects/`, {
        headers: {
          'xc-token': NOCODB_TOKEN,
        },
      });
      const data = await res.json();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
    
    if (name === 'nocodb_list_tables') {
      const res = await fetch(`${NOCODB_API_URL}/api/v1/db/meta/projects/${args.baseId}/tables`, {
        headers: {
          'xc-token': NOCODB_TOKEN,
        },
      });
      const data = await res.json();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
    
    if (name === 'nocodb_get_records') {
      const limit = args.limit || 25;
      const res = await fetch(`${NOCODB_API_URL}/api/v1/db/data/v1/${args.baseId}/${args.tableName}?limit=${limit}`, {
        headers: {
          'xc-token': NOCODB_TOKEN,
        },
      });
      const data = await res.json();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
    
    if (name === 'nocodb_create_record') {
      const res = await fetch(`${NOCODB_API_URL}/api/v1/db/data/v1/${args.baseId}/${args.tableName}`, {
        method: 'POST',
        headers: {
          'xc-token': NOCODB_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(args.data),
      });
      const data = await res.json();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
    
    if (name === 'nocodb_update_record') {
      const res = await fetch(`${NOCODB_API_URL}/api/v1/db/data/v1/${args.baseId}/${args.tableName}/${args.recordId}`, {
        method: 'PATCH',
        headers: {
          'xc-token': NOCODB_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(args.data),
      });
      const data = await res.json();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
    
    if (name === 'nocodb_delete_record') {
      const res = await fetch(`${NOCODB_API_URL}/api/v1/db/data/v1/${args.baseId}/${args.tableName}/${args.recordId}`, {
        method: 'DELETE',
        headers: {
          'xc-token': NOCODB_TOKEN,
        },
      });
      const data = await res.json();
      return {
        content: [
          {
            type: 'text',
            text: `Enregistrement ${args.recordId} supprimé`,
          },
        ],
      };
    }
    
    throw new Error(`Outil inconnu: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Erreur: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Endpoint SSE pour connexion MCP
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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ MCP Server (Coolify + NocoDB) démarré sur le port ${PORT}`);
});
