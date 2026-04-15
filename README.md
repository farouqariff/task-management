# Tally — Task Management App

Full-stack task manager with role-based access. Users manage their own tasks; admins manage everyone's.

## Tech stack

- **Backend:** Flask, Flask-SQLAlchemy, Flask-JWT-Extended, bcrypt, PyMySQL
- **Frontend:** React 19 (Vite), React Router, Axios, jwt-decode
- **Database:** MySQL 8
- **Infrastructure:** Docker Compose (3 services)

## Features

- Register / login with JWT auth (bcrypt-hashed passwords)
- Role-based authorization — `user` (own tasks only) and `admin` (all tasks)
- Full CRUD on tasks with per-task status (`pending` / `in_progress` / `completed`)
- Status filter + counts on dashboard
- Admin view shows task owner email
- Auto-logout on 401 (stale/expired token)

## Quick start (Docker)

1. **Install Docker Desktop** (https://www.docker.com/products/docker-desktop).
2. **Copy `.env.example` to a new file named `.env`** in the project root (any method — file explorer, IDE, or the shell command for your OS):
   - Linux / macOS / Git Bash: `cp .env.example .env`
   - Windows cmd: `copy .env.example .env`
   - Windows PowerShell: `Copy-Item .env.example .env`
3. **Run the stack:**
   ```
   docker compose up --build
   ```
   (This single command works in any shell on any OS.)

Once the containers are healthy:

- Frontend: http://localhost:8080
- Backend API: http://localhost:5000
- MySQL: localhost:3307 (mapped to container 3306)

Register a user at `/register`, or promote one to admin via SQL:

```sql
UPDATE users SET role='admin' WHERE email='you@example.com';
```

## Local dev (without Docker)

**Backend:**

```
cd backend
python -m venv venv
# activate the venv:
#   Linux / macOS:   source venv/bin/activate
#   Windows cmd:     venv\Scripts\activate.bat
#   Windows PS:      venv\Scripts\Activate.ps1
#   Git Bash:        source venv/Scripts/activate
pip install -r requirements.txt
# Create backend/.env (see example below)
python run.py
```

`backend/.env` for local dev (MySQL on host port 3307):

```
SECRET_KEY=dev-secret
JWT_SECRET_KEY=dev-jwt-secret
DATABASE_URL=mysql+pymysql://root:devpassword@localhost:3307/task_management
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Frontend dev server: http://localhost:5173

## API reference

| Method | Endpoint            | Auth | Body                                 | Notes                      |
| ------ | ------------------- | ---- | ------------------------------------ | -------------------------- |
| POST   | `/auth/register`    | no   | `{email, password, role?}`           | role defaults to `user`    |
| POST   | `/auth/login`       | no   | `{email, password}`                  | returns `{access_token}`   |
| GET    | `/tasks`            | JWT  | —                                    | admin: all; user: own      |
| POST   | `/tasks`            | JWT  | `{title, description?, status?}`     | user_id from JWT           |
| PUT    | `/tasks/<id>`       | JWT  | `{title?, description?, status?}`    | owner or admin             |
| DELETE | `/tasks/<id>`       | JWT  | —                                    | owner or admin             |

Status codes: `200/201` success, `400` validation, `401` unauth, `403` forbidden, `404` not found, `409` duplicate email.

## Project structure

```
tally-task-management/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── run.py
│   └── app/
│       ├── __init__.py          # Flask app factory
│       ├── config.py
│       ├── models/              # User, Task (SQLAlchemy)
│       └── routes/              # auth.py, tasks.py
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx              # Router
        ├── api/axios.js         # Axios instance + JWT interceptor
        ├── context/AuthContext.jsx
        ├── components/          # ProtectedRoute, TaskForm, TaskList, TaskItem
        └── pages/               # Login, Register, Dashboard
```

## Testing

Backend CRUD has 21 curl test cases covering all status codes. See session log in `PLAN.md`.

## License

MIT
