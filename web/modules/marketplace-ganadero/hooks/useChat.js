"use client";
import { useState, useCallback, useEffect } from "react";
import { buildChatId, sendMessage, getMessages, getConversations } from "../services/chat-service.js";

const MY_USER = { id: "mi-empresa", nombre: "Mi Empresa" };

export function useChat(listingId = null, vendedorId = null) {
  const [messages,       setMessages]       = useState([]);
  const [conversations,  setConversations]  = useState([]);
  const [activeChatId,   setActiveChatId]   = useState(null);
  const [input,          setInput]          = useState("");

  useEffect(() => {
    if (listingId && vendedorId) {
      const cid = buildChatId(MY_USER.id, vendedorId, listingId);
      setActiveChatId(cid);
      setMessages(getMessages(cid));
    }
    setConversations(getConversations(MY_USER.id));
  }, [listingId, vendedorId]);

  const send = useCallback((tipo = "texto", contenido, metadata = {}) => {
    if (!activeChatId || !contenido) return;
    sendMessage(activeChatId, { remitente: MY_USER, tipo, contenido, metadata });
    setMessages(getMessages(activeChatId));
    setInput("");
  }, [activeChatId]);

  const openConversation = useCallback((chatId) => {
    setActiveChatId(chatId);
    setMessages(getMessages(chatId));
  }, []);

  return {
    messages, conversations, activeChatId, input,
    setInput, send, openConversation,
    myUser: MY_USER,
  };
}
