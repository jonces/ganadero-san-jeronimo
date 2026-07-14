"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuperAdminLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { router.replace("/login"); return; }
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "SUPER_ADMIN") router.replace("/dashboard");
    } catch {
      router.replace("/login");
    }
  }, []);

  return <>{children}</>;
}
