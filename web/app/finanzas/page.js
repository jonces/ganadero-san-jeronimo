"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FinanzasRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/finanzas/resumen"); }, []);
  return null;
}
