"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { Popover } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

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
  disabled = false,
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
  disabled?: boolean;
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
          disabled={disabled}
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
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
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

export function MultiSearchSelect<T extends { value: string; label: React.ReactNode; searchText?: string }>({
  value,
  onValueChange,
  options,
  placeholder,
  emptyText,
  searchPlaceholder,
  className,
  disabled = false,
}: {
  value: string[];
  onValueChange: (v: string[]) => void;
  options: T[];
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { text } = useLanguage();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const selected = options.filter((o) => value.includes(o.value));
  const filtered = options.filter((o) =>
    search.trim().length === 0
      ? true
      : ((o.searchText ?? String(o.label))?.toLowerCase() ?? "").includes(search.toLowerCase())
  );

  const toggleValue = (next: string) => {
    onValueChange(
      value.includes(next)
        ? value.filter((v) => v !== next)
        : [...value, next]
    );
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
          disabled={disabled}
          className={cn("w-full justify-between truncate", className)}
        >
          <span className="truncate">
            {selected.length > 0
              ? text(
                  `${selected.length} categories selected`,
                  `Обрано категорій: ${selected.length}`
                )
              : placeholder ?? text("Select...", "Оберіть...")}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </Popover.Trigger>
      <Popover.Content className="w-[var(--radix-popover-trigger-width)] max-h-72 overflow-hidden rounded-lg border bg-popover p-0 shadow-lg">
        <div className="flex flex-col">
          <div className="border-b px-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder={searchPlaceholder ?? text("Search...", "Пошук...")}
                className="h-9 pl-7"
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
                {filtered.map((item) => {
                  const checked = value.includes(item.value);
                  return (
                    <li
                      key={item.value}
                      className="cursor-pointer px-3 py-1.5 hover:bg-muted"
                      onClick={() => toggleValue(item.value)}
                      role="option"
                      aria-selected={checked}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate">{item.label}</span>
                        {checked ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
