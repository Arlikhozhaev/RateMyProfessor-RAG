import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultRecommendations, WELCOME_MESSAGE } from "../../constants/app.js";

function createMemoryStorage() {
  const store = new Map();

  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

describe("chatSession", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("sessionStorage", createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null when nothing is stored", async () => {
    const { loadChatSession } = await import("../../lib/chatSession.js");
    expect(loadChatSession()).toBeNull();
  });

  it("persists and restores chat history without pending messages", async () => {
    const { loadChatSession, saveChatSession } = await import("../../lib/chatSession.js");
    const messages = [
      { role: "assistant", content: WELCOME_MESSAGE },
      { role: "user", content: "Best professors for software engineering" },
      { role: "assistant", content: "Here are a few strong matches." },
      { role: "assistant", content: "", pending: true },
    ];

    saveChatSession({
      messages,
      recommendations: defaultRecommendations,
      retrievalMethod: "keyword",
    });

    const restored = loadChatSession();
    expect(restored.messages).toHaveLength(3);
    expect(restored.messages.at(-1).content).toContain("strong matches");
    expect(restored.retrievalMethod).toBe("keyword");
  });
});
