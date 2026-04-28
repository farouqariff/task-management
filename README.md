# Tally — Task Management App

A full-stack task management application built with React, Flask, and MySQL.

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Vite
- **Backend:** Python, Flask, SQLAlchemy, JWT Auth
- **Database:** MySQL 8.0
- **Infra:** Docker, Nginx

---

## Running Locally with Docker

### Step 1 — Install Docker Desktop

Download and install Docker Desktop from: https://www.docker.com/products/docker-desktop/

Once installed, open Docker Desktop and make sure it is **running** (you should see the whale icon in your taskbar/menu bar).

---

### Step 2 — Clone the repo

**Mac / Linux (Terminal) or Windows (Git Bash):**
```bash
git clone <repo-url>
cd tally-task-management
```

**Windows (Command Prompt):**
```cmd
git clone <repo-url>
cd tally-task-management
```

**Windows (PowerShell):**
```powershell
git clone <repo-url>
cd tally-task-management
```

---

### Step 3 — Create your `.env` file

**Mac / Linux (Terminal) or Windows (Git Bash):**
```bash
cp .env.example .env
```

**Windows (Command Prompt):**
```cmd
copy .env.example .env
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

Now open the `.env` file in any text editor (Notepad, VS Code, etc.) and fill in the values. The `MAIL_USERNAME` and `MAIL_PASSWORD` are already provided — you only need to set the ones marked below:

```env
MYSQL_ROOT_PASSWORD=     # any password you want, e.g.  devpassword123
MYSQL_DATABASE=          # leave as task_management

SECRET_KEY=              # any random string, e.g.  supersecretkey
JWT_SECRET_KEY=          # any random string, e.g.  anothersecretkey

VITE_API_BASE_URL=http://localhost:5000    # leave this as-is

MAIL_USERNAME=tmatally@gmail.com
MAIL_PASSWORD=hicn oamx tzhv lodz

FRONTEND_URL=http://localhost    # leave this as-is
```

---

### Step 4 — Start the app

**All platforms (Terminal / Command Prompt / PowerShell / Git Bash):**
```bash
docker compose up --build
```

> The first run takes **2–3 minutes** to download and build everything. You will see a lot of logs — that is normal. Wait until you see a line that says `Attaching to ...` and the logs slow down.

---

### Step 5 — Open the app in your browser

- **App:** http://localhost
- **API:** http://localhost:5000

### Default Admin Login

| Field | Value |
|---|---|
| Email | `admin@tally.com` |
| Password | `abcd1234*` |

---

## Stopping the App

```bash
docker compose down
```

To also **delete the database** and start completely fresh:

```bash
docker compose down -v
```

---

## Project Structure

```
tally-task-management/
├── backend/
│   ├── app/
│   │   ├── models/        # SQLAlchemy models (User, Project, Task, etc.)
│   │   ├── routes/        # Flask blueprints (auth, users, projects, tasks, notifications, audit)
│   │   ├── schemas/       # Marshmallow schemas for validation and serialization
│   │   └── utils/         # Auth helpers and decorators
│   ├── Dockerfile
│   ├── requirements.txt
│   └── entrypoint.sh      # Waits for DB, seeds admin, starts Gunicorn
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # AuthContext (JWT token + user state)
│   │   ├── pages/         # Page-level components (Dashboard, Projects, Tasks, etc.)
│   │   └── services/      # api.ts — all HTTP calls to the backend
│   ├── Dockerfile
│   └── nginx.conf         # Serves built React app
├── docker-compose.yml
└── .env.example           # copy this to .env and fill in your values
```

---

## Architecture Overview

```
Browser
  └── http://localhost (port 80)
        └── Nginx  ──── serves the React SPA
                         React app calls http://localhost:5000
                              └── Flask API (port 5000)
                                    └── MySQL (port 3306, internal)
```

- The **frontend** is a React single-page application (SPA). All pages are client-side — Nginx just serves the static files.
- The **backend** is a REST API built with Flask. It handles authentication, business logic, and all database operations.
- The **database** is MySQL 8.0. The schema is created automatically on first startup via SQLAlchemy (`db.create_all()`). No manual migrations needed.
- **JWT tokens** are used for authentication. The token is stored in the browser's `localStorage` and sent with every API request.

---

## Features

### User Management
- Register and log in with email and password
- Forgot password via email (sends a reset link)
- Edit your own profile (name, email, password)
- Admin can create, edit, and delete user accounts

### Project Management
- Admin creates projects and assigns a **leader**
- Projects have members with two roles: **leader** and **member**
- Leaders and admins can add/remove members, rename the project, and change the leader
- Projects can be marked as **completed** — no new tasks can be added once completed
- Deleting a project deletes all its tasks automatically

### Task Management
- Tasks belong to a project and can be assigned to project members
- Each task has a **name**, **status** (To Do / Completed), **priority** (Low / Medium / High), and optional **due date**
- Task assignees can update the status and priority of their own tasks
- Task managers (admin, task creator, project leader) have full control over tasks

### Notifications
- Users receive in-app notifications for relevant events
- Notifications can be marked as read or deleted

### Audit Log (Admin only)
- Every significant action (create, update, delete) is recorded
- Admin can view the full history with user, action, resource, and IP address

---

## Roles & Permissions

There are three levels of access in Tally: **Admin**, **Project Leader**, and **Member**.

### Admin
Admins have full access to everything in the system.

| Action | Allowed? |
|---|---|
| View all projects | Yes |
| Create projects | Yes |
| Edit / delete any project | Yes |
| Add / remove any project member | Yes |
| View all tasks | Yes |
| Create, edit, delete any task | Yes |
| Manage all users | Yes |
| View audit log | Yes |

### Project Leader
A leader is a project member assigned the leader role by an admin.

| Action | Allowed? |
|---|---|
| View their project | Yes |
| Rename project / change leader | Yes |
| Add / remove project members | Yes |
| Create tasks in their project | Yes |
| Edit / delete any task in their project | Yes |
| Assign members to tasks | Yes |
| Mark project as completed | Yes |
| View audit log | No |
| Manage users | No |

### Member
A regular member of a project.

| Action | Allowed? |
|---|---|
| View their project and its tasks | Yes |
| Update status and priority of tasks assigned to them | Yes |
| Create tasks | Yes |
| Full edit or delete of tasks they created | Yes |
| Edit or delete tasks they didn't create | No |
| Add / remove project members | No |
| Mark project as completed | No |
| View audit log | No |
| Manage users | No |

> **Note:** A user cannot be deleted if they are the sole leader of any project. The leader must be reassigned first.
