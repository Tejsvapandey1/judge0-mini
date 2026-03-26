package main

import (
	"bytes"
	"net/http"
	"os/exec"

	"github.com/gin-gonic/gin"
)

type CodeRequest struct {
	Code string `json:"code"`
}

func runCode(code string) (string, string) {
	cmd := exec.Command(
		"docker", "run", "--rm",
		"-i",
		"--memory=100m",
		"--cpus=0.5",
		"--network=none",
		"--pids-limit=50",
		"code-runner-python",
		"python3", "-c", code,
	)

	var out bytes.Buffer
	var stderr bytes.Buffer

	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return out.String(), stderr.String()
	}

	return out.String(), ""
}

func main() {
	r := gin.Default()

	r.POST("/run", func(c *gin.Context) {
		var req CodeRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		output, errOutput := runCode(req.Code)

		c.JSON(http.StatusOK, gin.H{
			"output": output,
			"error":  errOutput,
		})
	})

	r.Run(":5000")
}
