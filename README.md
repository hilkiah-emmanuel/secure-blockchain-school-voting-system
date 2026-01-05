# Secure Blockchain School Voting System

> Secure, auditable, and user-friendly school voting system built with a React + Vite frontend and a Node.js backend integrating a local blockchain test environment.

## Table of contents
- [Project overview](#project-overview)
- [Key features](#key-features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quickstart (development)](#quickstart-development)
- [Build & production](#build--production)
- [Blockchain & local chain setup](#blockchain--local-chain-setup)
- [Testing & linting](#testing--linting)
- [Deployment notes](#deployment-notes)
- [Contributing](#contributing)
- [License & contact](#license--contact)

## Project overview

This repository contains a secure school voting application designed to demonstrate how blockchain primitives and a conventional backend can be combined to provide an auditable voting workflow. The frontend is a TypeScript React app (Vite) and the backend is an Express server that manages authentication, persistence, and a testing integration with a local blockchain.

Use cases: classroom elections, small organizational votes, and demonstrations of secure audit trails.

## Key features

- Modern React + TypeScript frontend with accessibility and responsive layout
- Express backend with JWT authentication and websocket support
- SQLite local persistence for easy setup and portability
- Optional local blockchain (Ganache) integration for demonstration of immutable vote anchoring
- Admin UI for managing classes, students, teachers, candidates and elections

## Tech stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, SQLite / better-sqlite3
- Blockchain tooling: Ganache, web3.js
- Misc: WebSockets, JSON Web Tokens, Bcrypt, Speakeasy for 2FA, QR generation

## Architecture

- `src/` — frontend application (Vite + React). Run and build with the root package scripts.
- `server/` — backend (Express). Runs separately from the frontend in development and production.
- `server/blockchain/` — blockchain-related helpers and scripts.
- `data/db/` — SQLite files used by the server for persistence.

## Prerequisites

- Node.js >= 18 (or use Bun if preferred) and npm/yarn/bun installed
- Git for cloning and version control
- Optional: Ganache (or allow the included Ganache dev dependency to run locally)

If you use Bun, install dependencies with `bun install`. Otherwise use `npm` or `yarn`.

## Quickstart (development)

1. Clone the repository (if you haven't already):

   git clone https://github.com/hilkiah-emmanuel/secure-blockchain-school-voting-system.git
   cd secure-blockchain-school-voting-system

2. Install dependencies (root installs frontend deps):

   npm install

   # install server dependencies
   cd server
   npm install
   cd ..

3. Start backend and frontend in separate terminals:

   # Terminal 1 — start the server in watch mode
   cd server
   npm run dev

   # Terminal 2 — start the frontend dev server
   cd ..
   npm run dev

4. Open the frontend at http://localhost:5173 (or the URL printed by Vite).

Notes:
- The server expects environment variables in `server/.env` when required. See the `server/index.js` and `server/database.js` to confirm names.
- The repository includes a small SQLite DB under `data/db/` for local development.

## Build & production

1. Build the frontend

   npm run build

2. Serve static assets with your preferred static server or integrate the built assets with the Express server. By default this repo keeps frontend and backend separate — implement a production deploy step to host the built frontend and point the backend to a production database.

3. Start the backend (production):

   cd server
   npm start

## Blockchain & local chain setup

The backend contains a `setup-ganache` helper script to prepare a local Ganache instance for demonstration purposes. To execute it:

   cd server
   npm run setup-ganache

This will create and seed a local chain used by the sample integration in `server/blockchain/` and `server/index.js` (where relevant).

### Notes on production blockchain use

This project uses a local test chain for development and education. Do not use this configuration for production on a public network without careful security, key-management and gas-cost planning.

## Testing & linting

- Lint the frontend codebase:

  npm run lint

- There are no automated unit tests included by default; consider adding test suites (Jest / Vitest) to validate critical logic before deployment.

## Deployment notes

- Configure environment variables securely (JWT secret, DB path, RPC endpoints).
- Use a persistent production-grade database for real data (SQLite is convenient but not recommended for multi-instance setups).
- For blockchain anchoring in production, move from Ganache to a managed or mainnet/testnet provider and secure private keys using a vault or key-management service.

## Contributing

Contributions are welcome. Please open issues for bug reports or feature requests and send pull requests with clear, focused changes and tests where applicable. Keep commit messages descriptive and follow this repository's commit message style.

Suggested PR checklist:
- Clear description of the change
- Minimal, focused commits with meaningful messages
- Any new scripts or behavior documented in `README.md`

## License & contact

This repository does not include a license file. Add a license suitable for your project (e.g., MIT, Apache-2.0) if you intend to publish or open-source the project.

Maintainer: Hilkiah Emmanuel — Repository: https://github.com/hilkiah-emmanuel/secure-blockchain-school-voting-system
# Secure Student Vote - Blockchain-Secured School Voting System

A comprehensive, local school voting system with blockchain security, real-time synchronization, and Apple-inspired UI/UX.

## Features

### Core Features
- ✅ **Local Deployment** - Runs on local network, no cloud dependency
- ✅ **Teacher Authentication** - Secure login with JWT and optional 2FA
- ✅ **Class Management** - Create classes, import students via CSV
- ✅ **Student Voting** - Simple, intuitive voting interface
- ✅ **Blockchain Integration** - Immutable vote storage using Web3.js and Ganache
- ✅ **Real-time Sync** - WebSocket-based synchronization across devices
- ✅ **Multiple Voting Types** - Single-choice, multi-choice, and ranked voting
- ✅ **PIN Verification** - Optional PIN protection for student votes
- ✅ **Private Mode** - Hide selections until submission
- ✅ **Results & Export** - Real-time results with CSV/PDF export
- ✅ **Dark Mode** - Automatic theme switching
- ✅ **Accessibility** - Screen reader support, large text, keyboard navigation
- ✅ **Offline Resilience** - Vote queue for offline scenarios

### UI/UX Features
- Apple-inspired minimalist design
- Smooth animations and transitions
- Mobile-responsive layout
- Gesture-based interactions
- High contrast mode
- Voice-over support

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Framer Motion for animations
- shadcn/ui components
- Zustand for state management
- React Query for data fetching

### Backend
- Node.js with Express
- SQLite database (better-sqlite3)
- WebSocket (ws) for real-time updates
- JWT for authentication
- bcryptjs for password hashing
- speakeasy for 2FA
- Web3.js for blockchain integration
- Ganache for local blockchain

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- (Optional) Ganache for blockchain testing

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd secure-student-vote-main
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Initialize database**
   The database will be created automatically on first server start.

6. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```
   Server will run on http://localhost:3001

7. **Start the frontend**
   ```bash
   npm run dev
   ```
   Frontend will run on http://localhost:8080

### Optional: Ganache Setup

For full blockchain functionality:

1. Install Ganache CLI:
   ```bash
   npm install -g ganache
   ```

2. Start Ganache:
   ```bash
   ganache --port 7545
   ```

3. Update `server/.env`:
   ```
   GANACHE_URL=http://localhost:7545
   ```

## Default Credentials

- **Admin**: admin@school.edu / admin123
- **Teacher**: Any email with password length >= 4

## Usage

### For Teachers

1. **Login** - Use your credentials at the login screen
2. **Create Classes** - Go to Admin > Classes to create new classes
3. **Import Students** - Upload CSV file or add students manually
4. **Create Elections** - Set up positions and candidates
5. **Open Voting** - Toggle voting open/closed for each class
6. **View Results** - See real-time results and export data

### For Students

1. **Select Name** - Tap your name from the class list
2. **Verify PIN** - Enter PIN if required
3. **Cast Vote** - Select candidates for each position
4. **Submit** - Confirm and submit your vote
5. **Confirmation** - See confirmation that vote was recorded

## Project Structure

```
secure-student-vote-main/
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── lib/                # Utilities and API client
│   ├── hooks/              # Custom React hooks
│   └── layouts/            # Layout components
├── server/                 # Backend source
│   ├── routes/             # API routes
│   ├── db/                 # Database setup
│   ├── blockchain/         # Blockchain integration
│   ├── websocket/          # WebSocket server
│   └── data/               # SQLite database
└── public/                 # Static assets
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Teacher login
- `POST /api/auth/register` - Register new teacher
- `POST /api/auth/setup-2fa` - Setup 2FA
- `POST /api/auth/enable-2fa` - Enable 2FA

### Classes
- `GET /api/classes` - Get all classes
- `POST /api/classes` - Create class
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class
- `POST /api/classes/:id/toggle-voting` - Toggle voting

### Students
- `GET /api/students/class/:classId` - Get students
- `POST /api/students` - Add student
- `POST /api/students/bulk` - Bulk import
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/:id/verify-pin` - Verify PIN

### Votes
- `POST /api/votes/submit` - Submit vote
- `GET /api/votes/queue` - Get vote queue
- `POST /api/votes/retry-queue` - Retry queued votes

### Results
- `GET /api/results/class/:classId` - Get results
- `GET /api/results/class/:classId/export/csv` - Export CSV
- `GET /api/results/class/:classId/export/json` - Export JSON

## Development

### Frontend Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Development
```bash
cd server
npm run dev          # Start with auto-reload
npm start            # Start production server
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Optional 2FA with TOTP
- PIN verification for students
- Blockchain-immutable vote records
- SQL injection protection (parameterized queries)
- CORS protection
- Input validation

## Privacy & Compliance

- All data stored locally
- No external cloud services
- FERPA-compliant design
- Vote anonymization in results
- Secure vote transmission

## Troubleshooting

### Database Issues
- Delete `server/data/voting.db` to reset database
- Check file permissions on data directory

### Blockchain Issues
- Ensure Ganache is running if using blockchain mode
- System falls back to simulation mode if blockchain unavailable

### WebSocket Issues
- Check firewall settings
- Verify WebSocket URL in environment variables

## License

This project is open-source and available for educational use.

## Contributing

Contributions are welcome! Please ensure:
- Code follows existing style
- Tests pass
- Documentation is updated

## Support

For issues or questions, please open an issue on the repository.
