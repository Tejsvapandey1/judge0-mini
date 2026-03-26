package handlers

import (
	"net/http"

	apiws "judge-api/api/websocket"

	"github.com/gin-gonic/gin"
	gorillawebsocket "github.com/gorilla/websocket"
)

var upgrader = gorillawebsocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func WSHandler(c *gin.Context) {
	jobID := c.Param("id")

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	apiws.WSManager.AddClient(jobID, conn)
}
