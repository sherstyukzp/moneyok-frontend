"use client";

import { Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export function ShellLoading({ label }: { label?: string }) {
  const { text } = useLanguage();

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {label ?? text("Loading...", "Завантаження…")}
        </p>
      </div>
    </div>
  );
}
