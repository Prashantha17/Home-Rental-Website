# Namma Mane 🏠 — Find Your Home Which Matches Your Vibe

Modern, full-stack home rental platform featuring zero broker commission, transparent pricing, location hierarchy search, AI vibe matching, digital 11-month lease generation, HRA rent receipts, and real-time owner-tenant communication.

---

## 📁 Project Architecture

The codebase is organized into clean, independent `frontend/` and `backend/` directories:

```text
home-rental-app/
├── frontend/                          # 🌐 React 19 + Vite Single-Page Application
│   ├── src/                           # Components, pages, contexts, services, utils
│   ├── public/                        # Static public assets
│   ├── index.html                     # Frontend HTML entry point
│   ├── vite.config.js                 # Vite code-splitting & manual chunks
│   ├── package.json                   # Dependencies & scripts
│   ├── Dockerfile                     # Multi-stage production Nginx container
│   └── nginx.conf                     # Nginx client-side routing config
│
├── backend/                           # ⚙️ Python FastAPI Microservice
│   ├── tests/                         # Pytest test suite
│   ├── static/uploads/                # Uploaded property images
│   ├── main.py                        # FastAPI endpoints, routes, lifespan & CORS
│   ├── db.py                          # MongoDB connection pooling & compound indexes
│   ├── models.py                      # Pydantic schemas
│   ├── auth.py                        # JWT authentication & bcrypt hashing
│   ├── notifications.py               # SMS and SMTP email notifications
│   ├── config.py                      # Environment configuration
│   ├── requirements.txt               # Backend dependencies
│   └── Dockerfile                     # Production Uvicorn container
│
├── docker-compose.yml                 # Multi-container orchestration (MongoDB + Backend + Frontend)
├── setup.bat                          # One-click automated setup wizard
├── start.bat                          # One-click startup manager
└── README.md                          # Project documentation
```

---

## 🚀 Quick Start (Local Development)

### 1. One-Click Setup (Windows)
Run the setup wizard:
```bat
setup.bat
```
Then start the application:
```bat
start.bat
```

### 2. Manual Startup

#### Backend:
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API Documentation will be live at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```
Frontend will be live at: [http://localhost:3000](http://localhost:3000)

---

## 🐳 Docker Multi-Container Deployment

Run the complete platform (MongoDB + Backend + Frontend) via Docker Compose:
```bash
docker compose up -d --build
```
* **Frontend**: [http://localhost:3000](http://localhost:3000)
* **Backend API**: [http://localhost:8000](http://localhost:8000)
* **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 🧪 Running Automated Tests

### Frontend Tests (Vitest):
```bash
cd frontend
npm test
```

### Backend Tests (Pytest):
```bash
cd backend
.\venv\Scripts\pytest tests/
```

---

## 🌐 Production Cloud Hosting

* **Frontend**: Deploy `frontend/` to **Vercel** or **Netlify**
  * Root Directory: `frontend`
  * Build Command: `npm run build`
  * Output Directory: `dist`
  * Environment Variable: `VITE_API_URL=https://your-backend-domain.com/api`

* **Backend**: Deploy `backend/` to **Render**, **Railway**, or **Fly.io**
  * Root Directory: `backend`
  * Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
  * Environment Variables: `MONGO_URI`, `JWT_SECRET_KEY`, `CORS_ORIGINS`, `ADMIN_INITIAL_PASSWORD`

* **Database**: Free cloud database on **MongoDB Atlas** (M0 cluster).
