import { useEffect, useRef } from "react";

/** Subscribe to server-sent reload events. */
export function useSSE(onReload: () => void, enabled = true) {
  const cb = useRef(onReload);
  cb.current = onReload;

  useEffect(() => {
    if (!enabled) return;
    const es = new EventSource("/api/events");

    const handle = () => cb.current();
    es.addEventListener("reload", handle);

    es.onerror = () => {
      // Browser will reconnect automatically
    };

    return () => {
      es.removeEventListener("reload", handle);
      es.close();
    };
  }, [enabled]);
}
