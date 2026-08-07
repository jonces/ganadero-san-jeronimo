"use client";
import { useEffect, useRef } from "react";
import { useConversation }   from "./useConversation.js";
import { SENDER }            from "../constants/index.js";

/**
 * Mensajes de la conversación activa con auto-scroll al final.
 * @param {{ autoScroll?: boolean }} [opts]
 */
export function useMessages({ autoScroll = true } = {}) {
  const { messages } = useConversation();
  const bottomRef    = useRef(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, autoScroll]);

  const userMessages = messages.filter(m => m.sender === SENDER.USER);
  const aiMessages   = messages.filter(m => m.sender === SENDER.AI);
  const lastMessage  = messages[messages.length - 1] ?? null;

  return {
    messages,
    userMessages,
    aiMessages,
    lastMessage,
    bottomRef,     // poner <div ref={bottomRef} /> al final de la lista
    isEmpty: messages.length === 0,
  };
}
