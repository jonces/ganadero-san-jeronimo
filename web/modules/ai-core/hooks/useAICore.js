"use client";
import { useState, useCallback, useRef } from "react";

const MEMORY_KEY = "ai_core_memory_v1";

function loadMemory() {
  try { return JSON.parse(localStorage.getItem(MEMORY_KEY) ?? "{}"); } catch { return {}; }
}

function saveMemory(data) {
  try { localStorage.setItem(MEMORY_KEY, JSON.stringify(data)); } catch {}
}

export function useAICore({ agentId, providerId, userCtx } = {}) {
  const [messages,  setMessages]  = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [error,     setError]     = useState(null);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [toolActivity, setToolActivity] = useState([]);
  const [imageUrl,     setImageUrl]     = useState(null);
  const abortRef = useRef(null);

  // Load conversation memory from localStorage on mount
  const [memory] = useState(() => loadMemory());

  const send = useCallback(async (userMessage, options = {}) => {
    if (!userMessage.trim() || streaming) return;

    setError(null);
    setImageUrl(null);
    setToolActivity([]);

    const userMsg = { role: "user", content: userMessage, ts: Date.now() };
    const assistantMsg = { role: "assistant", content: "", ts: Date.now(), loading: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    abortRef.current = new AbortController();

    // Build history for context (exclude loading messages)
    const history = messages
      .filter(m => !m.loading)
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }));

    const token   = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers,
        signal: abortRef.current.signal,
        body:   JSON.stringify({
          message:    userMessage,
          history,
          agentId:    options.agentId    ?? agentId,
          providerId: options.providerId ?? providerId,
          userCtx:    options.userCtx    ?? userCtx ?? {},
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";
      let fullText  = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let chunk;
          try { chunk = JSON.parse(line.slice(6)); } catch { continue; }

          if (chunk.type === "agent") {
            setCurrentAgent(chunk.agent);
          }

          if (chunk.type === "delta") {
            fullText += chunk.content;
            setMessages(prev => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") {
                next[next.length - 1] = { ...last, content: fullText, loading: false };
              }
              return next;
            });
          }

          if (chunk.type === "tool_calls") {
            setToolActivity(prev => [...prev, ...chunk.calls.map(c => ({ name: c.name, args: c.args, status: "running" }))]);
          }

          if (chunk.type === "tool_result") {
            setToolActivity(prev => prev.map(t =>
              t.name === chunk.name ? { ...t, status: "done", result: chunk.result } : t
            ));
            // If the tool result contains an image request, generate it
            if (chunk.result?.isImage && chunk.result?.data?.action === "generate_image") {
              generateImage(chunk.result.data.prompt, chunk.result.data);
            }
          }

          if (chunk.type === "error") {
            setError(chunk.message);
            setMessages(prev => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") {
                next[next.length - 1] = { ...last, content: chunk.message, loading: false, isError: true };
              }
              return next;
            });
            break;
          }

          if (chunk.type === "done") break;
        }
      }

      // Persist to memory
      const mem = loadMemory();
      mem.lastAgent = currentAgent;
      mem.messageCount = (mem.messageCount ?? 0) + 1;
      saveMemory(mem);

    } catch (e) {
      if (e.name !== "AbortError") {
        setError(e.message);
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant") {
            next[next.length - 1] = { ...last, content: `Error: ${e.message}`, loading: false, isError: true };
          }
          return next;
        });
      }
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming, agentId, providerId, userCtx, currentAgent]);

  const generateImage = useCallback(async (prompt, options = {}) => {
    try {
      const res  = await fetch("/api/ai/images", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, size: options.size, style: options.style }),
      });
      const data = await res.json();
      if (data.ok && data.url) {
        setImageUrl(data.url);
        // Add image to chat
        setMessages(prev => [...prev, {
          role: "assistant", content: `![Imagen generada](${data.url})`, ts: Date.now(),
          isImage: true, imageUrl: data.url, revised_prompt: data.revised_prompt,
        }]);
      }
    } catch {}
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setToolActivity([]);
    setImageUrl(null);
    setError(null);
  }, []);

  const addSystemMessage = useCallback((content) => {
    setMessages(prev => [...prev, { role: "assistant", content, ts: Date.now(), isSystem: true }]);
  }, []);

  return {
    messages, streaming, error, currentAgent, toolActivity, imageUrl, memory,
    send, abort, clearHistory, generateImage, addSystemMessage,
  };
}
