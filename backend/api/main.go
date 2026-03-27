package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"

	"judge-api/api/handlers"
	apiws "judge-api/api/websocket"
	"judge-api/shared"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()

const redisAddr = "localhost:6379"
const jobsQueue = "jobs"

func getRedisAddr() string {
	if addr := os.Getenv("REDIS_ADDR"); addr != "" {
		return addr
	}

	return redisAddr
}

func newRedisClient() *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr: getRedisAddr(),
	})
}

func jobKey(id string) string {
	return "job:" + id
}

func writeJobResult(rdb *redis.Client, result shared.JobResult) error {
	payload, err := json.Marshal(result)
	if err != nil {
		return err
	}

	return rdb.Set(ctx, jobKey(result.ID), payload, 0).Err()
}

func submitJobHandler(rdb *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req shared.CodeRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		job := shared.Job{
			ID:        uuid.New().String(),
			Code:      req.Code,
			Language:  req.Language,
			TestCases: req.TestCases,
		}

		jobJSON, err := json.Marshal(job)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to encode job"})
			return
		}

		if err := writeJobResult(rdb, shared.JobResult{ID: job.ID, Status: "pending"}); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save job status"})
			return
		}

		if err := rdb.LPush(c.Request.Context(), jobsQueue, jobJSON).Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "queue failed"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Job submitted",
			"job_id":  job.ID,
		})
	}
}

func statusHandler(rdb *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		val, err := rdb.Get(c.Request.Context(), jobKey(id)).Result()
		if err != nil {
			if errors.Is(err, redis.Nil) {
				c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch job"})
			return
		}

		var result shared.JobResult
		if err := json.Unmarshal([]byte(val), &result); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to decode job result"})
			return
		}

		c.JSON(http.StatusOK, result)
	}
}

func main() {
	r := gin.Default()
	questionDB := mustQuestionDB()
	defer questionDB.Close()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	rdb := newRedisClient()
	go apiws.StartSubscriber(rdb)

	if count, err := questionStats(questionDB); err != nil {
		log.Printf("failed to count seeded questions: %v", err)
	} else {
		log.Printf("questions ready: %d", count)
	}

	r.GET("/questions", listQuestionsHandler(questionDB))
	r.GET("/questions/:slug", getQuestionHandler(questionDB))
	r.POST("/run", submitJobHandler(rdb))
	r.GET("/status/:id", statusHandler(rdb))
	r.GET("/ws/:id", handlers.WSHandler)

	r.Run(":5000")
}
