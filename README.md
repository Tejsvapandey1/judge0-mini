# Judge0 Mini

A small full-stack online code runner with:

- a `React + Vite + Tailwind CSS` frontend
- a `Go + Gin + Redis` backend API
- a background worker that executes jobs asynchronously
- WebSocket updates for real-time result delivery

## Features

- Submit code in `Python`, `C++`, and `Java`
- Queue-based asynchronous execution
- Redis-backed job state
- WebSocket result streaming
- Monaco editor UI
- Responsive layout
- Light mode / dark mode toggle

## Project Structure

```text
Judge0-mini/
├── frontend/   # React app
├── backend/    # Go API + worker
├── .gitignore
└── README.md
```

## How It Works

1. The frontend sends code and test cases to `POST /run`.
2. The API creates a job id and stores the job in Redis.
3. The worker picks the job from the queue and runs it.
4. The final result is saved in Redis and published to WebSocket clients.
5. The frontend receives the result and renders verdicts/output.

## Tech Stack

### Frontend

- React 19
- Vite
- Tailwind CSS 4
- Monaco Editor

### Backend

- Go
- Gin
- Redis
- Docker

## Local Setup

### 1. Clone the project

```bash
git clone https://github.com/Tejsvapandey1/judge0-mini.git
cd judge0-mini
```

### 2. Start Redis

```bash
docker run -d --name judge-redis -p 6379:6379 redis:7
```

### 3. Run the backend API

```bash
cd backend
go run ./api
```

### 4. Run the worker

Open a second terminal:

```bash
cd backend
go run ./worker
```

### 5. Run the frontend

Open a third terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will usually run at:

```text
http://localhost:5173
```

The backend API runs at:

```text
http://localhost:5000
```

## API Overview

### Submit code

`POST /run`

Example request:

```json
{
  "code": "a, b = map(int, input().split())\nprint(a + b)",
  "language": "python",
  "test_cases": [
    {
      "input": "2 3",
      "output": "5"
    }
  ]
}
```

Example response:

```json
{
  "message": "Job submitted",
  "job_id": "some-uuid"
}
```

### Check status

`GET /status/:id`

Example response:

```json
{
  "id": "some-uuid",
  "status": "completed",
  "results": [
    {
      "input": "2 3",
      "expected": "5",
      "got": "5",
      "verdict": "Accepted"
    }
  ]
}
```

## Git Setup

If this folder is not connected to the GitHub repo yet:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/Tejsvapandey1/judge0-mini.git
git push -u origin main
```

If `origin` already exists:

```bash
git remote set-url origin https://github.com/Tejsvapandey1/judge0-mini.git
git push -u origin main
```

## Notes

- The frontend expects the backend at `http://localhost:5000`
- The WebSocket endpoint is `ws://localhost:5000/ws/:id`
- The final execution output is returned as `results[].got`

## Future Improvements

- add custom test case management in the UI
- improve execution state feedback
- add authentication and per-user submissions
- add automated frontend and backend tests
