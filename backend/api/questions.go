package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	_ "modernc.org/sqlite"
)

type questionSummary struct {
	ID         int64    `json:"id"`
	Slug       string   `json:"slug"`
	Title      string   `json:"title"`
	Difficulty string   `json:"difficulty"`
	Topics     []string `json:"topics"`
}

type questionDetail struct {
	ID          int64             `json:"id"`
	Slug        string            `json:"slug"`
	Title       string            `json:"title"`
	Difficulty  string            `json:"difficulty"`
	Topics      []string          `json:"topics"`
	Description string            `json:"description"`
	Examples    []questionExample `json:"examples"`
	Constraints []string          `json:"constraints"`
	StarterCode map[string]string `json:"starterCode"`
	TestCases   []questionTest    `json:"testCases"`
}

type questionExample struct {
	Input       string `json:"input"`
	Output      string `json:"output"`
	Explanation string `json:"explanation,omitempty"`
}

type questionTest struct {
	Input  string `json:"input"`
	Output string `json:"output"`
}

type seedQuestion struct {
	Slug        string
	Title       string
	Difficulty  string
	Topics      []string
	Description string
	Examples    []questionExample
	Constraints []string
	StarterCode map[string]string
	TestCases   []questionTest
}

func openQuestionDB() (*sql.DB, error) {
	dbPath := os.Getenv("QUESTIONS_DB_PATH")
	if dbPath == "" {
		dbPath = filepath.Join("data", "questions.db")
	}

	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		return nil, err
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	if err := initQuestionSchema(db); err != nil {
		return nil, err
	}

	if err := seedQuestions(db); err != nil {
		return nil, err
	}

	return db, nil
}

func initQuestionSchema(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS questions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			slug TEXT NOT NULL UNIQUE,
			title TEXT NOT NULL,
			difficulty TEXT NOT NULL,
			topics_json TEXT NOT NULL,
			description TEXT NOT NULL,
			examples_json TEXT NOT NULL,
			constraints_json TEXT NOT NULL,
			starter_code_json TEXT NOT NULL,
			test_cases_json TEXT NOT NULL
		);
	`)

	return err
}

func seedQuestions(db *sql.DB) error {
	for _, question := range seededQuestions() {
		if err := upsertQuestion(db, question); err != nil {
			return err
		}
	}

	return nil
}

func upsertQuestion(db *sql.DB, question seedQuestion) error {
	topicsJSON, err := json.Marshal(question.Topics)
	if err != nil {
		return err
	}

	examplesJSON, err := json.Marshal(question.Examples)
	if err != nil {
		return err
	}

	constraintsJSON, err := json.Marshal(question.Constraints)
	if err != nil {
		return err
	}

	starterJSON, err := json.Marshal(question.StarterCode)
	if err != nil {
		return err
	}

	testCasesJSON, err := json.Marshal(question.TestCases)
	if err != nil {
		return err
	}

	_, err = db.Exec(`
		INSERT INTO questions (
			slug, title, difficulty, topics_json, description,
			examples_json, constraints_json, starter_code_json, test_cases_json
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(slug) DO UPDATE SET
			title = excluded.title,
			difficulty = excluded.difficulty,
			topics_json = excluded.topics_json,
			description = excluded.description,
			examples_json = excluded.examples_json,
			constraints_json = excluded.constraints_json,
			starter_code_json = excluded.starter_code_json,
			test_cases_json = excluded.test_cases_json;
	`, question.Slug, question.Title, question.Difficulty, string(topicsJSON), question.Description, string(examplesJSON), string(constraintsJSON), string(starterJSON), string(testCasesJSON))

	return err
}

func listQuestionsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.Query(`
			SELECT id, slug, title, difficulty, topics_json
			FROM questions
			ORDER BY id ASC
		`)
		if err != nil {
			c.JSON(500, gin.H{"error": "failed to load questions"})
			return
		}
		defer rows.Close()

		questions := []questionSummary{}
		for rows.Next() {
			var item questionSummary
			var topicsJSON string
			if err := rows.Scan(&item.ID, &item.Slug, &item.Title, &item.Difficulty, &topicsJSON); err != nil {
				c.JSON(500, gin.H{"error": "failed to decode question"})
				return
			}

			if err := json.Unmarshal([]byte(topicsJSON), &item.Topics); err != nil {
				c.JSON(500, gin.H{"error": "failed to parse topics"})
				return
			}

			questions = append(questions, item)
		}

		c.JSON(200, gin.H{"questions": questions})
	}
}

func getQuestionHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		slug := c.Param("slug")

		var question questionDetail
		var topicsJSON, examplesJSON, constraintsJSON, starterJSON, testCasesJSON string

		err := db.QueryRow(`
			SELECT id, slug, title, difficulty, topics_json, description,
				examples_json, constraints_json, starter_code_json, test_cases_json
			FROM questions
			WHERE slug = ?
		`, slug).Scan(
			&question.ID,
			&question.Slug,
			&question.Title,
			&question.Difficulty,
			&topicsJSON,
			&question.Description,
			&examplesJSON,
			&constraintsJSON,
			&starterJSON,
			&testCasesJSON,
		)
		if err != nil {
			if err == sql.ErrNoRows {
				c.JSON(404, gin.H{"error": "question not found"})
				return
			}

			c.JSON(500, gin.H{"error": "failed to load question"})
			return
		}

		if err := json.Unmarshal([]byte(topicsJSON), &question.Topics); err != nil {
			c.JSON(500, gin.H{"error": "failed to parse topics"})
			return
		}
		if err := json.Unmarshal([]byte(examplesJSON), &question.Examples); err != nil {
			c.JSON(500, gin.H{"error": "failed to parse examples"})
			return
		}
		if err := json.Unmarshal([]byte(constraintsJSON), &question.Constraints); err != nil {
			c.JSON(500, gin.H{"error": "failed to parse constraints"})
			return
		}
		if err := json.Unmarshal([]byte(starterJSON), &question.StarterCode); err != nil {
			c.JSON(500, gin.H{"error": "failed to parse starter code"})
			return
		}
		if err := json.Unmarshal([]byte(testCasesJSON), &question.TestCases); err != nil {
			c.JSON(500, gin.H{"error": "failed to parse test cases"})
			return
		}

		c.JSON(200, question)
	}
}

func seededQuestions() []seedQuestion {
	return []seedQuestion{
		{
			Slug:       "two-sum-stream",
			Title:      "Two Sum Stream",
			Difficulty: "Easy",
			Topics:     []string{"Array", "Math"},
			Description: strings.TrimSpace(`Given a line containing two integers, return their sum.

This warm-up problem mirrors the kind of first problem people expect in an online judge, but the interface should still feel like a real coding platform: choose a language, write a solution, and verify it against multiple test cases.`),
			Examples: []questionExample{
				{Input: "2 3", Output: "5", Explanation: "Add both numbers and print the result."},
				{Input: "10 -4", Output: "6"},
			},
			Constraints: []string{
				"Both integers fit in 32-bit signed range.",
				"Print exactly one integer followed by an optional newline.",
			},
			StarterCode: map[string]string{
				"python": "a, b = map(int, input().split())\n# Write your solution below\nprint(a + b)\n",
				"cpp":    "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    // Write your solution below\n    cout << a + b << \"\\n\";\n    return 0;\n}\n",
				"java":   "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        // Write your solution below\n        System.out.println(a + b);\n    }\n}\n",
			},
			TestCases: []questionTest{{Input: "2 3", Output: "5"}, {Input: "10 -4", Output: "6"}, {Input: "0 0", Output: "0"}},
		},
		{
			Slug:       "palindrome-checker",
			Title:      "Palindrome Checker",
			Difficulty: "Easy",
			Topics:     []string{"String", "Two Pointers"},
			Description: strings.TrimSpace(`Given a lowercase string on a single line, print true if it reads the same forward and backward, otherwise print false.

The output must be lowercase exactly as shown in the examples.`),
			Examples: []questionExample{
				{Input: "level", Output: "true"},
				{Input: "judge", Output: "false"},
			},
			Constraints: []string{
				"1 <= s.length <= 1000",
				"The input string contains only lowercase English letters.",
			},
			StarterCode: map[string]string{
				"python": "s = input().strip()\n# Write your solution below\nprint(str(s == s[::-1]).lower())\n",
				"cpp":    "#include <algorithm>\n#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n    string reversed = s;\n    reverse(reversed.begin(), reversed.end());\n    cout << (s == reversed ? \"true\" : \"false\") << \"\\n\";\n    return 0;\n}\n",
				"java":   "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine().trim();\n        String reversed = new StringBuilder(s).reverse().toString();\n        System.out.println(s.equals(reversed) ? \"true\" : \"false\");\n    }\n}\n",
			},
			TestCases: []questionTest{{Input: "level", Output: "true"}, {Input: "judge", Output: "false"}, {Input: "abba", Output: "true"}},
		},
		{
			Slug:       "maximum-of-three",
			Title:      "Maximum of Three",
			Difficulty: "Easy",
			Topics:     []string{"Math", "Implementation"},
			Description: strings.TrimSpace(`Read three space-separated integers and print the largest one.

This is a small problem, but it gives the platform a useful third sample with different starter code and multiple hidden checks.`),
			Examples: []questionExample{
				{Input: "1 9 3", Output: "9"},
				{Input: "-5 -2 -8", Output: "-2"},
			},
			Constraints: []string{
				"All values fit in 32-bit signed integers.",
				"Print exactly one integer.",
			},
			StarterCode: map[string]string{
				"python": "a, b, c = map(int, input().split())\n# Write your solution below\nprint(max(a, b, c))\n",
				"cpp":    "#include <algorithm>\n#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b, c;\n    cin >> a >> b >> c;\n    cout << max(a, max(b, c)) << \"\\n\";\n    return 0;\n}\n",
				"java":   "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        int c = sc.nextInt();\n        System.out.println(Math.max(a, Math.max(b, c)));\n    }\n}\n",
			},
			TestCases: []questionTest{{Input: "1 9 3", Output: "9"}, {Input: "-5 -2 -8", Output: "-2"}, {Input: "7 7 7", Output: "7"}},
		},
	}
}

func questionStats(db *sql.DB) (int, error) {
	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM questions").Scan(&count); err != nil {
		return 0, err
	}
	return count, nil
}

func mustQuestionDB() *sql.DB {
	db, err := openQuestionDB()
	if err != nil {
		panic(fmt.Errorf("failed to open question database: %w", err))
	}

	return db
}
