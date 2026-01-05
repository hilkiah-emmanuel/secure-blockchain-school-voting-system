# Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 2. Configure Environment

Create `server/.env`:
```env
PORT=3001
WS_PORT=3002
FRONTEND_URL=http://localhost:8080
JWT_SECRET=your-secret-key-change-in-production
GANACHE_URL=http://localhost:7545
```

### 3. Start Services

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 4. Access Application

- Frontend: http://localhost:8080
- Backend API: http://localhost:3001
- WebSocket: ws://localhost:3001/ws

## Optional: Ganache Setup

For full blockchain functionality:

```bash
# Install Ganache CLI globally
npm install -g ganache

# Start Ganache
ganache --port 7545

# Update server/.env
GANACHE_URL=http://localhost:7545
```

## Default Login

- Email: `admin@school.edu`
- Password: `admin123`

## Troubleshooting

### Port Already in Use
Change ports in:
- `vite.config.ts` (frontend)
- `server/.env` (backend)

### Database Issues
Delete `server/data/voting.db` to reset.

### WebSocket Connection Failed
- Check firewall settings
- Verify WebSocket URL matches backend port









