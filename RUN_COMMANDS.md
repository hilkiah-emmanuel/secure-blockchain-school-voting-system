# Terminal Commands to Run the Application

## Quick Start (Two Terminal Windows)

### Terminal 1 - Backend Server
```bash
cd /Users/festomanolo/Downloads/secure-student-vote-main/server
npm install
npm run dev
```

### Terminal 2 - Frontend Server
```bash
cd /Users/festomanolo/Downloads/secure-student-vote-main
npm install
npm run dev
```

---

## Step-by-Step Instructions

### Step 1: Install Backend Dependencies (if not already done)
```bash
cd /Users/festomanolo/Downloads/secure-student-vote-main/server
npm install
```

### Step 2: Start Backend Server
```bash
cd /Users/festomanolo/Downloads/secure-student-vote-main/server
npm run dev
```

**Expected output:**
```
✅ Database initialized
✅ Blockchain initialized
🚀 Server running on http://localhost:3001
📡 WebSocket server ready on ws://localhost:3002
```

### Step 3: Install Frontend Dependencies (if not already done)
```bash
cd /Users/festomanolo/Downloads/secure-student-vote-main
npm install
```

### Step 4: Start Frontend Server (in a NEW terminal)
```bash
cd /Users/festomanolo/Downloads/secure-student-vote-main
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
```

---

## All-in-One Command (Single Terminal - Background)

If you want to run both in one terminal:

```bash
cd /Users/festomanolo/Downloads/secure-student-vote-main/server && npm run dev &
cd /Users/festomanolo/Downloads/secure-student-vote-main && npm run dev
```

---

## Check if Servers are Running

### Check Backend
```bash
curl http://localhost:3001/health
```

**Expected response:**
```json
{"status":"ok","timestamp":"..."}
```

### Check Frontend
```bash
curl http://localhost:8080
```

Should return HTML content.

---

## Stop Servers

Press `Ctrl + C` in each terminal window to stop the servers.

---

## Login Credentials

Once both servers are running, open:
- **Frontend**: http://localhost:8080

**Login:**
- Email: `admin@school.edu`
- Password: `admin123`

---

## Troubleshooting Commands

### Check if ports are in use
```bash
# Check port 3001 (backend)
lsof -i :3001

# Check port 8080 (frontend)
lsof -i :8080
```

### Kill processes on ports (if needed)
```bash
# Kill process on port 3001
kill -9 $(lsof -t -i:3001)

# Kill process on port 8080
kill -9 $(lsof -t -i:8080)
```

### Reset Database (if needed)
```bash
rm /Users/festomanolo/Downloads/secure-student-vote-main/server/data/voting.db
```

---

## Development Commands

### Backend
```bash
cd server
npm run dev      # Start with auto-reload
npm start        # Start production mode
```

### Frontend
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```








