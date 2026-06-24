import { useCallback, useEffect, useRef } from "react";

/**
 * Keeps scroll pinned to the bottom of a chat container without moving the page.
 * Auto-scroll is disabled until enableAutoScroll() is called (e.g. when the user sends a message).
 */
export function useChatAutoScroll(trigger, isStreaming) {
  const containerRef = useRef(null);
  const autoScrollEnabledRef = useRef(false);

  const enableAutoScroll = useCallback(() => {
    autoScrollEnabledRef.current = true;
  }, []);

  useEffect(() => {
    if (!autoScrollEnabledRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: isStreaming ? "auto" : "smooth",
    });
  }, [trigger, isStreaming]);

  return { containerRef, enableAutoScroll };
}
