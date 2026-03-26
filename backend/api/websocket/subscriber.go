package websocket

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()

func StartSubscriber(rdb *redis.Client) {
	sub := rdb.Subscribe(ctx, "job_updates")

	ch := sub.Channel()

	for msg := range ch {
		fmt.Println("Received update")

		var data map[string]interface{}
		if err := json.Unmarshal([]byte(msg.Payload), &data); err != nil {
			fmt.Println("failed to decode websocket payload:", err)
			continue
		}

		jobID, ok := data["id"].(string)
		if !ok || jobID == "" {
			fmt.Println("websocket payload missing job id")
			continue
		}

		WSManager.SendResult(jobID, []byte(msg.Payload))
	}
}
