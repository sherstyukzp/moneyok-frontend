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

export function AddCategoryDialog({ triggerInline = false }: { triggerInline?: boolean }) {
  const { addCategory } = useData();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [kind, setKind] = React.useState<"expense" | "income">("expense");

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    addCategory({ name: name.trim(), kind });
    setName("");
    setKind("expense");
    setOpen(false);
  };

  const trigger = triggerInline ? (
    <DialogTrigger asChild>
      <button className="flex h-7 w-full items-center gap-2 rounded-md px-2 text-xs text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring">
        <Plus className="size-3.5" />
        <span>Додати категорію</span>
      </button>
    </DialogTrigger>
  ) : (
    <DialogTrigger asChild>
      <Button variant="outline" size="sm">
        <Plus />
        Додати категорію
      </Button>
    </DialogTrigger>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Нова категорія</DialogTitle>
          <DialogDescription>
            Категорія буде додана в активну книгу бюджетування.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Назва</FieldLabel>
            <FieldContent>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Наприклад, Кавʼярні"
                autoFocus
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Тип</FieldLabel>
            <FieldContent>
              <Select value={kind} onValueChange={(v) => setKind(v as "expense" | "income")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Витрата</SelectItem>
                  <SelectItem value="income">Дохід</SelectItem>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Скасувати
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Додати категорію
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}