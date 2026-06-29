import { describe, expect, it } from "vitest";

function buildJsonRequest(url, body, cookies = "") {
  return new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookies ? { Cookie: cookies } : {}),
    },
    body: JSON.stringify(body),
  });
}

function extractSessionCookie(response) {
  const header = response.headers.get("set-cookie");
  if (!header) return "";

  const match = header.match(/professor_session=([^;]+)/);
  return match ? `professor_session=${match[1]}` : "";
}

async function readTextResponse(response) {
  return response.text();
}

describe("API integration", () => {
  it("registers a user and sets a session cookie", async () => {
    const { POST } = await import("../../app/api/auth/register/route.js");
    const email = `student-${Date.now()}@example.com`;

    const response = await POST(
      buildJsonRequest("http://localhost/api/auth/register", {
        email,
        password: "TestPassword123!",
        name: "Integration Student",
      })
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.user.email).toBe(email);
    expect(extractSessionCookie(response)).toContain("professor_session=");
  });

  it("logs in with valid credentials", async () => {
    const { POST: register } = await import("../../app/api/auth/register/route.js");
    const { POST: login } = await import("../../app/api/auth/login/route.js");
    const email = `login-${Date.now()}@example.com`;
    const password = "LoginPassword123!";

    await register(
      buildJsonRequest("http://localhost/api/auth/register", {
        email,
        password,
        name: "Login Student",
      })
    );

    const response = await login(
      buildJsonRequest("http://localhost/api/auth/login", { email, password })
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.user.email).toBe(email);
    expect(extractSessionCookie(response)).toContain("professor_session=");
  });

  it("rejects login with an invalid password", async () => {
    const { POST: register } = await import("../../app/api/auth/register/route.js");
    const { POST: login } = await import("../../app/api/auth/login/route.js");
    const email = `bad-login-${Date.now()}@example.com`;

    await register(
      buildJsonRequest("http://localhost/api/auth/register", {
        email,
        password: "CorrectPassword123!",
        name: "Bad Login Student",
      })
    );

    const response = await login(
      buildJsonRequest("http://localhost/api/auth/login", {
        email,
        password: "WrongPassword123!",
      })
    );

    expect(response.status).toBe(401);
  });

  it("returns ranked recommendations for a subject query", async () => {
    const { POST } = await import("../../app/api/recommendations/route.js");

    const response = await POST(
      buildJsonRequest("http://localhost/api/recommendations", {
        query: "software engineering hands-on projects",
      })
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.matches.length).toBeGreaterThan(0);
    expect(payload.method).toBe("keyword");

    const professors = payload.matches.map((match) => match.professor);
    expect(
      professors.some((name) =>
        ["David Nguyen", "Prof. James Lee"].includes(name)
      )
    ).toBe(true);
  });

  it("returns a deterministic dataset answer from chat", async () => {
    const { POST } = await import("../../app/api/chat/route.js");

    const response = await POST(
      buildJsonRequest("http://localhost/api/chat", [
        { role: "user", content: "How many professors are in the dataset?" },
      ])
    );

    expect(response.status).toBe(200);
    const text = await readTextResponse(response);
    expect(text).toContain("41 professors");
  });

  it("returns a keyword-backed chat answer without API keys", async () => {
    const { POST } = await import("../../app/api/chat/route.js");

    const response = await POST(
      buildJsonRequest("http://localhost/api/chat", [
        { role: "user", content: "Who teaches software engineering?" },
      ])
    );

    expect(response.status).toBe(200);
    const text = await readTextResponse(response);
    expect(text).toMatch(/software|engineering|Nguyen|Lee/i);
  });
});
