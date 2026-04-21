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
├── backend/           # Flask REST API
├── frontend/          # React + Vite SPA
├── docker-compose.yml
└── .env.example       # copy this to .env and fill in your values
```
