package shared

type Verdict string

const (
	Accepted          Verdict = "Accepted"
	WrongAnswer       Verdict = "Wrong Answer"
	TimeLimitExceeded Verdict = "Time Limit Exceeded"
	RuntimeError      Verdict = "Runtime Error"
	CompilationError  Verdict = "Compilation Error"
)

type CodeRequest struct {
	Code      string     `json:"code"`
	Language  string     `json:"language"`
	TestCases []TestCase `json:"test_cases"`
}

type Job struct {
	ID        string     `json:"id"`
	Code      string     `json:"code"`
	Language  string     `json:"language"`
	TestCases []TestCase `json:"test_cases"`
}

type JobResult struct {
	ID      string           `json:"id"`
	Status  string           `json:"status"`
	Results []TestCaseResult `json:"results,omitempty"`
}

type TestCase struct {
	Input  string `json:"input"`
	Output string `json:"output"`
}

type TestCaseResult struct {
	Input    string  `json:"input"`
	Expected string  `json:"expected"`
	Got      string  `json:"got"`
	Verdict  Verdict `json:"verdict"`
}
