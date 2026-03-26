# Judge API

A small asynchronous code execution service built with Go, Gin, Redis, and Docker.

The project has two main parts:

- `api/`: accepts submissions and stores job status in Redis
- `worker/`: pulls jobs from Redis, runs code inside Docker containers, and writes results back

Supported language runners are stored in:

- `docker/python/Dockerfile`
- `docker/cpp/Dockerfile`
- `docker/java/Dockerfile`

## How It Works

1. A client sends code, language, and test cases to `POST /run`.
2. The API creates a job ID and pushes the job into the Redis `jobs` queue.
3. The worker blocks on the queue, picks up jobs, runs them, and stores the result in Redis.
4. The client polls `GET /status/:id` to read the current job status and final verdicts.

## Project Structure

```text
.
├── api/
│   └── main.go
├── worker/
│   └── main.go
├── shared/
│   └── types.go
├── helper/
│   └── helper.go
├── docker/
│   ├── python/
│   ├── cpp/
│   └── java/
├── go.mod
└── docker-compose.yaml
```

## Requirements

- Go 1.25+
- Docker
- Redis

## Run Locally

Start Redis first:

```bash
docker run -d --name judge-redis -p 6379:6379 redis:7
```

Start the API:

```bash
go run ./api
```

Start the worker in another terminal:

```bash
go run ./worker
```

Build the language runner images:

```bash
docker build -t code-runner-python -f docker/python/Dockerfile .
docker build -t code-runner-cpp -f docker/cpp/Dockerfile .
docker build -t code-runner-java -f docker/java/Dockerfile .
```

## API

### Submit a job

`POST /run`

Example request:

```json
{
  "code": "print(input())",
  "language": "python",
  "test_cases": [
    {
      "input": "hello",
      "output": "hello"
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

### Check job status

`GET /status/:id`

Example response:

```json
{
  "id": "some-uuid",
  "status": "completed",
  "results": [
    {
      "input": "hello",
      "expected": "hello",
      "got": "hello",
      "verdict": "Accepted"
    }
  ]
}
```

## Job Status Values

- `pending`
- `running`
- `completed`

## Verdict Values

- `Accepted`
- `Wrong Answer`
- `Time Limit Exceeded`
- `Runtime Error`
- `Compilation Error`

## Notes

- Redis is currently hardcoded to `localhost:6379` in both the API and worker.
- Job results are stored under Redis keys like `job:<job-id>`.
- The worker uses Docker isolation flags like memory, CPU, `--network=none`, and `--read-only`.

## Next Improvements

- move Redis config to environment variables
- improve language-specific sandboxing
- separate compilation and runtime errors more explicitly
- add automated tests for API and worker flows
