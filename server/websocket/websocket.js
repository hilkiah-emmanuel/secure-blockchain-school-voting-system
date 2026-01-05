import { WebSocketServer } from 'ws';
import { getDatabase } from '../db/database.js';

const clients = new Map(); // Map of clientId -> WebSocket
const classSubscriptions = new Map(); // Map of classId -> Set of clientIds

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  wss.on('connection', (ws, req) => {
    const clientId = generateClientId();
    clients.set(clientId, ws);
    
    console.log(`✅ WebSocket client connected: ${clientId}`);

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        await handleMessage(clientId, data);
      } catch (error) {
        console.error('WebSocket message error:', error);
        sendToClient(clientId, {
          type: 'error',
          message: 'Invalid message format'
        });
      }
    });

    ws.on('close', () => {
      console.log(`❌ WebSocket client disconnected: ${clientId}`);
      clients.delete(clientId);
      
      // Remove from all class subscriptions
      classSubscriptions.forEach((clientSet, classId) => {
        clientSet.delete(clientId);
        if (clientSet.size === 0) {
          classSubscriptions.delete(classId);
        }
      });
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Send welcome message
    sendToClient(clientId, {
      type: 'connected',
      clientId
    });
  });

  console.log('✅ WebSocket server initialized');
}

function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function handleMessage(clientId, data) {
  const { type, payload } = data;

  switch (type) {
    case 'subscribe':
      subscribeToClass(clientId, payload.classId);
      break;
    
    case 'unsubscribe':
      unsubscribeFromClass(clientId, payload.classId);
      break;
    
    case 'ping':
      sendToClient(clientId, { type: 'pong', timestamp: Date.now() });
      break;
    
    default:
      sendToClient(clientId, {
        type: 'error',
        message: `Unknown message type: ${type}`
      });
  }
}

function subscribeToClass(clientId, classId) {
  if (!classSubscriptions.has(classId)) {
    classSubscriptions.set(classId, new Set());
  }
  classSubscriptions.get(classId).add(clientId);
  
  sendToClient(clientId, {
    type: 'subscribed',
    classId
  });
}

function unsubscribeFromClass(clientId, classId) {
  const clientSet = classSubscriptions.get(classId);
  if (clientSet) {
    clientSet.delete(clientId);
    if (clientSet.size === 0) {
      classSubscriptions.delete(classId);
    }
  }
  
  sendToClient(clientId, {
    type: 'unsubscribed',
    classId
  });
}

export function broadcastToClass(classId, message) {
  const clientSet = classSubscriptions.get(classId);
  if (!clientSet) return;

  clientSet.forEach(clientId => {
    sendToClient(clientId, message);
  });
}

export function sendToClient(clientId, message) {
  const ws = clients.get(clientId);
  if (ws && ws.readyState === 1) { // WebSocket.OPEN
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Error sending to client ${clientId}:`, error);
    }
  }
}

export function broadcastToAll(message) {
  clients.forEach((ws, clientId) => {
    sendToClient(clientId, message);
  });
}









