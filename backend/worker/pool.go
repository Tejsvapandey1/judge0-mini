package main

import (
	"bytes"
	"fmt"
	"os/exec"
	"strings"
)

const poolSize = 5

var (
	pythonPool = make(chan string, poolSize)
	cppPool    = make(chan string, poolSize)
	javaPool   = make(chan string, poolSize)
)

func createContainer(image string) string {
	cmd := exec.Command(
		"docker",
		"run",
		"-dit",
		"--rm",
		"--memory=200m",
		"--cpus=1.0",
		"--network=none",
		"--pids-limit=64",
		"--read-only",
		"--tmpfs",
		"/workspace:rw,exec,nosuid,size=64m",
		"-w",
		"/workspace",
		image,
		"sh",
	)

	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		fmt.Println("Error creating container:", err, stderr.String())
		return ""
	}

	return strings.TrimSpace(out.String())
}

func initPools() error {
	for lang, config := range languages {
		pool := getPool(lang)
		for i := 0; i < poolSize; i++ {
			containerID := createContainer(config.Image)
			if containerID == "" {
				return fmt.Errorf("failed to create %s container", lang)
			}
			pool <- containerID
		}
	}

	fmt.Println("Container pools initialized")
	return nil
}

func getPool(lang string) chan string {
	switch lang {
	case "python":
		return pythonPool
	case "cpp":
		return cppPool
	case "java":
		return javaPool
	default:
		return nil
	}
}
