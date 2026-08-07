"use client";
import { useState, useEffect, useCallback } from "react";
import { getOrdersByUser, getQuotesByUser } from "../services/order-service.js";

const MY_ID = "mi-empresa";

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [quotes, setQuotes] = useState([]);

  const reload = useCallback(() => {
    setOrders(getOrdersByUser(MY_ID));
    setQuotes(getQuotesByUser(MY_ID));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { orders, quotes, reload };
}
