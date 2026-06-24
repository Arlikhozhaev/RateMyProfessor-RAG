"use client";

import { useCallback, useState } from "react";
import { defaultRecommendations, WELCOME_MESSAGE } from "../constants/app";
import { useChatAutoScroll } from "./useChatAutoScroll";

export function useChat(onAnalyticsRefresh) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: WELCOME_MESSAGE },
  ]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(defaultRecommendations);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [retrievalMethod, setRetrievalMethod] = useState(null);

  const { containerRef: chatContainerRef, enableAutoScroll } = useChatAutoScroll(
    messages,
    loading
  );

  const sendMessage = useCallback(
    async (promptOverride) => {
      const text = (promptOverride || message).trim();
      if (!text || loading) return;

      const userMessage = { role: "user", content: text };
      const requestPayload = [...messages, userMessage];
      const nextMessages = [
        ...requestPayload,
        { role: "assistant", content: "", pending: true },
      ];

      enableAutoScroll();
      setMessages(nextMessages);
      setMessage("");
      setLoading(true);
      setRecommendationsLoading(true);

      try {
        const recRes = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: text }),
        });
        const recData = await recRes.json();

        if (recData.matches?.length) {
          setRecommendations(recData.matches);
        }
        if (recData.method) {
          setRetrievalMethod(recData.method);
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestPayload),
        });

        if (!response.ok) {
          throw new Error("The AI assistant could not respond right now.");
        }

        if (!response.body) {
          throw new Error("No response body received.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        const processChunk = async () => {
          const { done, value } = await reader.read();
          if (done) return;

          const textChunk = decoder.decode(value, { stream: true });

          setMessages((prev) => {
            const lastIndex = prev.length - 1;
            const lastMessage = prev[lastIndex];
            return [
              ...prev.slice(0, lastIndex),
              {
                ...lastMessage,
                content: lastMessage.content + textChunk,
                pending: false,
              },
            ];
          });

          return processChunk();
        };

        await processChunk();
        await onAnalyticsRefresh?.();
      } catch (error) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            role: "assistant",
            content:
              error instanceof Error
                ? error.message
                : "Something went wrong while generating a response.",
          },
        ]);
      } finally {
        setLoading(false);
        setRecommendationsLoading(false);
      }
    },
    [message, loading, messages, enableAutoScroll, onAnalyticsRefresh]
  );

  const askAboutProfessor = useCallback(
    (recommendation) => {
      sendMessage(
        `Tell me more about ${recommendation.professor} and whether they're a good fit for ${recommendation.subject}.`
      );
    },
    [sendMessage]
  );

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return {
    messages,
    message,
    loading,
    recommendations,
    recommendationsLoading,
    retrievalMethod,
    chatContainerRef,
    setMessage,
    sendMessage,
    askAboutProfessor,
    handleKeyDown,
  };
}
