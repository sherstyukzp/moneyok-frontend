"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { useData } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

export function CreateBookDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { createBudgetBook } = useData();
  const { text } = useLanguage();
  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const canSave = name.trim().length > 0 && !saving;

  const handleCreate = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await createBudgetBook(name.trim());
      toast.success(text("Book created", "Книгу створено"));
      setName("");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : text("Could not create the book", "Не вдалося створити книгу")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{text("New budget book", "Нова книга обліку")}</DialogTitle>
          <DialogDescription>
            {text(
              "Name your new budget book. It will be empty; add accounts and categories from the sidebar.",
              "Назвіть нову книгу бюджетування. Вона буде порожньою — додайте рахунки та категорії через бічне меню."
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>{text("Name", "Назва")}</FieldLabel>
            <FieldContent>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleCreate();
                }}
                placeholder={text("For example, Family or Work", "Наприклад, Family або Work")}
                autoFocus
              />
            </FieldContent>
          </Field>
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {text("Cancel", "Скасувати")}
          </Button>
          <Button onClick={handleCreate} disabled={!canSave}>
            {saving ? text("Creating...", "Створення…") : text("Create book", "Створити книгу")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
