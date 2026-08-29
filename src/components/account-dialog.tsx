"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldLabel,
} from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useData } from "@/lib/store";
import type { AccountType } from "@/lib/types";

const ACCOUNT_TYPES: Array<{ value: AccountType; label: string }> = [
  { value: "cash", label: "Готівка" },
  { value: "bank", label: "Банківський рахунок" },
  { value: "credit", label: "Кредитна картка" },
  { value: "investment", label: "Інвестиції" },
  { value: "other", label: "Інше" },
];

export function AddAccountDialog({ triggerInline = false }: { triggerInline?: boolean }) {
  const { addAccount } = useData();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<AccountType>("cash");
  const [balance, setBalance] = React.useState("0");

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    addAccount({
      name: name.trim(),
      type,
      initial_balance: Math.round((Number(balance) || 0) * 100) / 100,
    });
    setName("");
    setType("cash");
    setBalance("0");
    setOpen(false);
  };

  const trigger = triggerInline ? (
    <DialogTrigger asChild>
      <button className="flex h-7 w-full items-center gap-2 rounded-md px-2 text-xs text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring">
        <Plus className="size-3.5" />
        <span>Додати рахунок</span>
      </button>
    </DialogTrigger>
  ) : (
    <DialogTrigger asChild>
      <Button variant="outline" size="sm">
        <Plus />
        Додати рахунок
      </Button>
    </DialogTrigger>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новий рахунок</DialogTitle>
          <DialogDescription>
            Рахунок буде додано в активну книгу бюджетування.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Назва</FieldLabel>
            <FieldContent>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Наприклад, Готівка вдома"
                autoFocus
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Тип рахунку</FieldLabel>
            <FieldContent>
              <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Початковий залишок</FieldLabel>
            <FieldContent>
              <Input
                type="number"
                inputMode="decimal"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </FieldContent>
          </Field>
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Скасувати
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Додати рахунок
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}