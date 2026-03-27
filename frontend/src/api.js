const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

function getWSBaseUrl() {
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL;
  }

  if (API_BASE_URL.startsWith("https://")) {
    return API_BASE_URL.replace("https://", "wss://");
  }

  return API_BASE_URL.replace("http://", "ws://");
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    throw new Error(errorPayload?.error ?? `Request failed: ${response.status}`);
  }

  return response.json();
}

export function listQuestions() {
  return request("/questions");
}

export function getQuestion(slug) {
  return request(`/questions/${slug}`);
}

export async function submitCode(data) {
  const payload = {
    ...data,
    test_cases: data.test_cases ?? data.testCases ?? [],
  };

  delete payload.testCases;

  return request("/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function connectToJob(jobId) {
  return new WebSocket(`${getWSBaseUrl()}/ws/${jobId}`);
}
