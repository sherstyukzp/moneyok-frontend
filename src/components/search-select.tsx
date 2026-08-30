"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { Popover } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21l-4.35-4.35"></path>
  </svg>
);

export function SearchSelect<T extends { value: string; label: React.ReactNode; searchText?: string }>({
  value,
  onValueChange,
  options,
  placeholder,
  emptyText,
  searchPlaceholder,
  className,
  footer,
  selectable,
  closeOnSelect = true,
  emptySearch = true,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: T[];
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  className?: string;
  footer?: React.ReactNode;
  selectable?: boolean;
  closeOnSelect?: boolean;
  emptySearch?: boolean;
}) {
  const { text } = useLanguage();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = emptySearch
    ? options.filter((o) =>
        search.trim().length === 0
          ? true
          : ((o.searchText ?? String(o.label))?.toLowerCase() ?? "").includes(search.toLowerCase())
      )
    : options;

  const handleSelect = (v: string) => {
    if (selectable !== false) {
      onValueChange(v);
      if (closeOnSelect) {
        setOpen(false);
        setSearch("");
      }
    }
  };

  const handleOpen = (next: boolean) => {
    setOpen(next);
    if (next) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpen}>
      <Popover.Trigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between truncate", className)}
        >
          {selected?.label ?? placeholder ?? text("Select...", "Оберіть...")}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </Popover.Trigger>
      <Popover.Content className="w-[var(--radix-popover-trigger-width)] max-h-60 overflow-y-auto rounded-lg border bg-popover p-0 shadow-lg">
        <div className="flex flex-col">
          <div className="border-b px-3">
            <div className="relative">
              <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder={searchPlaceholder ?? text("Search...", "Пошук...")}
                className="pl-7 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setOpen(false);
                    setSearch("");
                  }
                }}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                {emptyText ?? text("Nothing found", "Нічого не знайдено")}
              </div>
            ) : (
              <ul className="flex flex-col">
                {filtered.map((item) => (
                  <li
                    key={item.value}
                    className="cursor-pointer px-3 py-1.5 hover:bg-muted"
                    onClick={() => handleSelect(item.value)}
                    role="option"
                    aria-selected={value === item.value}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{item.label}</span>
                      {value === item.value && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {footer ? <div className="border-t p-3">{footer}</div> : null}
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
