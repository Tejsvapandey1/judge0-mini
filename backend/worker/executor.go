package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"
	"time"

	"judge-api/helper"
	"judge-api/shared"

	"github.com/redis/go-redis/v9"
)

type languageConfig struct {
	Image      string
	SourceFile string
	CompileCmd string
	RunCmd     string
	CleanupCmd string
}

var languages = map[string]languageConfig{
	"python": {
		Image:      "code-runner-python",
		SourceFile: "main.py",
		RunCmd:     "python3 main.py",
		CleanupCmd: "rm -f main.py",
	},
	"cpp": {
		Image:      "code-runner-cpp",
		SourceFile: "main.cpp",
		CompileCmd: "g++ main.cpp -o main",
		RunCmd:     "./main",
		CleanupCmd: "rm -f main.cpp main",
	},
	"java": {
		Image:      "code-runner-java",
		SourceFile: "Main.java",
		CompileCmd: "javac Main.java",
		RunCmd:     "java Main",
		CleanupCmd: "rm -f Main.java Main.class",
	},
}

type executionResult struct {
	Outputs []string
	ErrText string
	ErrType shared.Verdict
}

func runAllTestCases(code, lang string, testCases []shared.TestCase) executionResult {
	pool := getPool(lang)
	if pool == nil {
		return executionResult{
			ErrText: "unsupported language",
			ErrType: shared.RuntimeError,
		}
	}

	containerID := <-pool
	config := languages[lang]

	defer func() {
		exec.Command("docker", "exec", containerID, "sh", "-c", config.CleanupCmd).Run()
		pool <- containerID
	}()

	if err := writeSourceFile(containerID, config.SourceFile, code); err != nil {
		return executionResult{
			ErrText: err.Error(),
			ErrType: shared.RuntimeError,
		}
	}

	if config.CompileCmd != "" {
		if compileErr := runContainerCommand(containerID, config.CompileCmd, "", compileTimeout); compileErr.ErrText != "" {
			if compileErr.ErrType == shared.TimeLimitExceeded {
				compileErr.ErrText = "Compilation timed out"
			}
			compileErr.ErrType = shared.CompilationError
			return compileErr
		}
	}

	runResult := runContainerCommand(containerID, config.RunCmd, buildCombinedInput(testCases), runTimeout)
	if runResult.ErrText != "" {
		return runResult
	}

	return runResult
}

func writeSourceFile(containerID, sourceFile, code string) error {
	ctxTimeout, cancel := context.WithTimeout(ctx, compileTimeout)
	defer cancel()

	execCmd := exec.CommandContext(
		ctxTimeout,
		"docker",
		"exec",
		"-i",
		containerID,
		"sh",
		"-c",
		"cat > "+sourceFile,
	)
	execCmd.Stdin = strings.NewReader(code)

	var stderr bytes.Buffer
	execCmd.Stderr = &stderr

	if err := execCmd.Run(); err != nil {
		if ctxTimeout.Err() == context.DeadlineExceeded {
			return fmt.Errorf(string(shared.TimeLimitExceeded))
		}

		if stderr.Len() > 0 {
			return fmt.Errorf(stderr.String())
		}

		return err
	}

	return nil
}

func runContainerCommand(containerID, command, stdin string, timeout time.Duration) executionResult {
	ctxTimeout, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	execCmd := exec.CommandContext(
		ctxTimeout,
		"docker",
		"exec",
		"-i",
		containerID,
		"sh",
		"-c",
		command,
	)
	execCmd.Stdin = strings.NewReader(stdin)

	var out bytes.Buffer
	var stderr bytes.Buffer

	execCmd.Stdout = &out
	execCmd.Stderr = &stderr

	if err := execCmd.Run(); err != nil {
		if ctxTimeout.Err() == context.DeadlineExceeded {
			return executionResult{
				ErrText: "TLE",
				ErrType: shared.TimeLimitExceeded,
			}
		}

		if stderr.Len() > 0 {
			return executionResult{
				ErrText: stderr.String(),
				ErrType: shared.RuntimeError,
			}
		}

		return executionResult{
			ErrText: err.Error(),
			ErrType: shared.RuntimeError,
		}
	}

	if out.Len() == 0 {
		return executionResult{
			Outputs: []string{},
		}
	}

	return executionResult{
		Outputs: strings.Split(strings.TrimSpace(out.String()), "\n"),
	}
}

func buildCombinedInput(testCases []shared.TestCase) string {
	var builder strings.Builder

	for _, tc := range testCases {
		builder.WriteString(tc.Input)
		builder.WriteByte('\n')
	}

	return builder.String()
}

func processJob(job shared.Job, rdb *redis.Client) {
	if err := writeJobResult(rdb, shared.JobResult{
		ID:     job.ID,
		Status: statusRunning,
	}); err != nil {
		fmt.Println("failed to mark job running:", err)
	}

	fmt.Println("Processing:", job.ID)

	execution := runAllTestCases(job.Code, job.Language, job.TestCases)
	results := evaluateResults(job.TestCases, execution)

	final := shared.JobResult{
		ID:      job.ID,
		Status:  "completed",
		Results: results,
	}

	finalJSON, err := json.Marshal(final)
	if err != nil {
		fmt.Println("failed to marshal final job result:", err)
		return
	}

	err = rdb.Set(ctx, "job:"+job.ID, finalJSON, 0).Err()
	if err != nil {
		fmt.Println("Redis SET error:", err)
	}

	err = rdb.Publish(ctx, "job_updates", finalJSON).Err()
	if err != nil {
		fmt.Println("Redis Publish error:", err)
	}
}

func evaluateResults(testCases []shared.TestCase, execution executionResult) []shared.TestCaseResult {
	results := make([]shared.TestCaseResult, 0, len(testCases))

	for i, tc := range testCases {
		result := shared.TestCaseResult{
			Input:    tc.Input,
			Expected: tc.Output,
		}

		switch {
		case execution.ErrText != "":
			result.Got = execution.ErrText
			result.Verdict = execution.ErrType
		case i < len(execution.Outputs) && helper.Normalize(execution.Outputs[i]) == helper.Normalize(tc.Output):
			result.Got = execution.Outputs[i]
			result.Verdict = shared.Accepted
		default:
			if i < len(execution.Outputs) {
				result.Got = execution.Outputs[i]
			}
			result.Verdict = shared.WrongAnswer
		}

		results = append(results, result)
	}

	return results
}

func writeJobResult(rdb *redis.Client, result shared.JobResult) error {
	payload, err := json.Marshal(result)
	if err != nil {
		return err
	}

	return rdb.Set(ctx, jobKey(result.ID), payload, 0).Err()
}
