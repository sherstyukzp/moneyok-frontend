"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ShellLoading } from "@/components/shell-loading";
import { useLanguage } from "@/lib/i18n";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const { text } = useLanguage();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session, router]);

  if (loading || !session) {
    return <ShellLoading label={text("Checking session...", "Перевірка сесії…")} />;
  }

  return <>{children}</>;
}
