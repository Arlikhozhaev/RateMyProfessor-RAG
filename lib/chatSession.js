import { defaultRecommendations } from "../constants/app.js";

const STORAGE_KEY = "professorMatch_chat_v1";

export function loadChatSession() {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) {
      return null;
    }

    return {
      messages: parsed.messages.filter((message) => !message.pending),
      recommendations: parsed.recommendations ?? defaultRecommendations,
      retrievalMethod: parsed.retrievalMethod ?? null,
    };
  } catch {
    return null;
  }
}

export function saveChatSession({ messages, recommendations, retrievalMethod }) {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        messages: messages.filter((message) => !message.pending),
        recommendations,
        retrievalMethod,
      })
    );
  } catch {
    // Ignore quota or privacy-mode errors.
  }
}
