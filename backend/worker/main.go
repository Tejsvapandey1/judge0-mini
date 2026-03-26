package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"judge-api/shared"

	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()

const (
	defaultRedisAddr = "localhost:6379"
	jobsQueue        = "jobs"
	statusRunning    = "running"
	statusCompleted  = "completed"
	compileTimeout   = 10 * time.Second
	runTimeout       = 3 * time.Second
	maxWorkers       = 10
)

var workerPool = make(chan struct{}, maxWorkers)

func redisAddr() string {
	if addr := os.Getenv("REDIS_ADDR"); addr != "" {
		return addr
	}

	return defaultRedisAddr
}

func newRedisClient() *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr: redisAddr(),
	})
}

func jobKey(id string) string {
	return "job:" + id
}

func main() {
	rdb := newRedisClient()

	if err := initPools(); err != nil {
		panic(err)
	}

	fmt.Println("Worker started")

	for {
		result, err := rdb.BRPop(ctx, 0, jobsQueue).Result()
		if err != nil {
			fmt.Println("Redis error:", err)
			continue
		}

		var job shared.Job
		if err := json.Unmarshal([]byte(result[1]), &job); err != nil {
			fmt.Println("Decode error:", err)
			continue
		}

		// LIMIT CONCURRENCY
		workerPool <- struct{}{}

		go func(job shared.Job) {
			defer func() { <-workerPool }()
			processJob(job, rdb)
		}(job)
	}
}
