import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import expressWs from 'express-ws';
import dotenv from 'dotenv';
import { initDatabase } from './db/database.js';
import { initBlockchain } from './blockchain/blockchain.js';
import authRoutes from './routes/auth.js';
import classRoutes from './routes/classes.js';
import studentRoutes from './routes/students.js';
import teacherRoutes from './routes/teachers.js';
import electionRoutes from './routes/elections.js';
import voteRoutes from './routes/votes.js';
import resultsRoutes from './routes/results.js';
import { setupWebSocket } from './websocket/websocket.js';

dotenv.config();

const app = express();
const server = createServer(app);
expressWs(app, server);

const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 3002;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/results', resultsRoutes);

// WebSocket setup
setupWebSocket(server);

// Initialize database and blockchain
async function startServer() {
  try {
    await initDatabase();
    console.log('✅ Database initialized');
    
    await initBlockchain();
    console.log('✅ Blockchain initialized');
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 WebSocket server ready on ws://localhost:${WS_PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();


