"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const TITLES: Record<string, string> = {
  "/overview": "Огляд",
  "/transactions": "Транзакції",
  "/budgets": "Бюджети",
  "/settings": "Налаштування",
};

export function SiteHeader() {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "MoneyOK";

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-4" />
      <h1 className="text-sm font-medium tracking-tight">{title}</h1>
    </header>
  );
}