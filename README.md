# ⚡ CodeSync — Real-Time Collaborative Coding Platform

A full-stack web application for real-time collaborative coding with code execution, chat, version control, and AI assistance.

---

## 🗂 Project Structure

```
codesync/
├── backend/              # Node.js + Express + Socket.IO
│   ├── config/           # Database config
│   ├── controllers/      # Route logic (auth, room, code, AI)
│   ├── middleware/        # JWT auth middleware
│   ├── models/           # MongoDB schemas (User, Room, Snapshot)
│   ├── routes/           # Express route definitions
│   ├── sockets/          # Socket.IO event handlers
│   ├── server.js         # Entry point
│   └── .env.example      # Environment variable template
│
└── frontend/             # React.js app
    ├── public/
    └── src/
        ├── components/
        │   ├── AI/       # AIPanel (OpenAI assistant)
        │   ├── Chat/     # ChatPanel (real-time messaging)
        │   ├── Editor/   # CodeEditor (Monaco) + ConsolePanel
        │   └── Room/     # TopBar + Sidebar
        ├── context/      # AuthContext (JWT state)
        ├── hooks/        # useSocket (Socket.IO events)
        ├── pages/        # AuthPage, LobbyPage, EditorPage
        └── utils/        # api.js, socket.js, languages.js
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))
- npm or yarn

---

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values (see below)
npm run dev
```

Backend runs on: `http://localhost:5000`

---

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if your backend is on a different port
npm start
```

Frontend runs on: `http://localhost:3000`

---

## ⚙️ Environment Variables

### `backend/.env`

| Variable | Description | Required |
|---|---|---|
| `PORT` | Server port (default: 5000) | No |
| `MONGO_URI` | MongoDB connection string | **Yes** |
| `JWT_SECRET` | Secret key for JWT tokens | **Yes** |
| `CODE_EXECUTOR` | `piston` (free) or `judge0` | No |
| `JUDGE0_API_KEY` | RapidAPI key for Judge0 | Only if using Judge0 |
| `OPENAI_API_KEY` | OpenAI key for AI assistant | No |
| `CLIENT_URL` | Frontend URL for CORS | No |

### `frontend/.env`

| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Backend API URL |
| `REACT_APP_SOCKET_URL` | Socket.IO server URL |

---

## 🌐 Code Execution

CodeSync supports two execution backends:

### Option A: Piston API (Recommended — Free, no key needed)
Set `CODE_EXECUTOR=piston` in backend `.env`. No setup needed.

### Option B: Judge0 via RapidAPI
1. Sign up at [RapidAPI](https://rapidapi.com/judge0-official/api/judge0-ce)
2. Get your API key
3. Set `CODE_EXECUTOR=judge0` and `JUDGE0_API_KEY=your_key`

---

## 🤖 AI Assistant (Optional)

1. Get an API key from [OpenAI](https://platform.openai.com)
2. Add `OPENAI_API_KEY=sk-...` to `backend/.env`
3. The AI panel will activate automatically in the editor

---

## 🔌 API Endpoints

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/guest` | Guest login |
| GET | `/api/auth/me` | Get current user |

### Rooms
| Method | Route | Description |
|---|---|---|
| POST | `/api/rooms/create` | Create room |
| GET | `/api/rooms/:roomId` | Get room details |
| POST | `/api/rooms/:roomId/join` | Join room |
| PUT | `/api/rooms/:roomId/code` | Save code |
| GET | `/api/rooms/:roomId/snapshots` | Get version history |
| DELETE | `/api/rooms/:roomId` | Close room |

### Code Execution
| Method | Route | Description |
|---|---|---|
| POST | `/api/code/execute` | Run code |
| GET | `/api/code/languages` | Supported languages |

### AI
| Method | Route | Description |
|---|---|---|
| POST | `/api/ai/assist` | AI code assistance |

---

## 🔄 Socket.IO Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `join-room` | `{ roomId, username }` | Join a coding room |
| `code-change` | `{ roomId, code }` | Broadcast code update |
| `cursor-move` | `{ roomId, position }` | Share cursor position |
| `chat-message` | `{ roomId, message }` | Send chat message |
| `language-change` | `{ roomId, language }` | Change language |
| `save-snapshot` | `{ roomId, code, label }` | Save version |
| `restore-snapshot` | `{ roomId, snapshotId }` | Restore version |
| `leave-room` | `{ roomId }` | Leave room |

### Server → Client
| Event | Description |
|---|---|
| `room-joined` | Initial room state on join |
| `code-update` | Remote code change |
| `cursor-update` | Remote cursor position |
| `user-joined` | User joined notification |
| `user-left` | User left notification |
| `chat-message` | Incoming chat message |
| `language-updated` | Language changed |
| `snapshot-saved` | New version saved |
| `code-restored` | Version restored |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Monaco Editor, Socket.IO Client |
| Backend | Node.js, Express.js |
| Real-time | Socket.IO |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Code Execution | Piston API / Judge0 |
| AI | OpenAI GPT-4o-mini |

---

## 🚢 Deployment

### Backend → Railway / Render
1. Push backend folder to GitHub
2. Create new service, set root to `/backend`
3. Add all environment variables
4. Deploy

### Frontend → Vercel / Netlify
1. Push frontend folder to GitHub
2. Set build command: `npm run build`
3. Set `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL` to your deployed backend URL
4. Deploy

### Database → MongoDB Atlas
1. Create free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Get connection string
3. Add to `MONGO_URI` in backend env

---

## 📜 License
MIT
