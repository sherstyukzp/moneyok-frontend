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

import { SearchSelect } from "@/components/search-select";
import { CategorySwatch } from "@/components/category-looks";
import { leafCategories } from "@/lib/categories";
import { useData } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";
import type { Recipient, Category } from "@/lib/types";

export function RecipientDialog({
  trigger,
  open,
  onOpenChange,
  recipient,
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  recipient?: Recipient | null;
}) {
  const { addRecipient, updateRecipient, accounts, categories, activeBookId } = useData();
  const { text } = useLanguage();
  const [internalOpen, setInternalOpen] = React.useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = (next: boolean) =>
    isControlled ? onOpenChange?.(next) : setInternalOpen(next);

  const isEdit = !!recipient;
  const bookAccounts = React.useMemo(
    () => accounts.filter((a) => a.budget_book_id === activeBookId),
    [accounts, activeBookId]
  );

  const leafCats = React.useMemo(
    () => leafCategories(categories, activeBookId),
    [categories, activeBookId]
  );

  const [name, setName] = React.useState(recipient?.name ?? "");
  const [accountId, setAccountId] = React.useState(recipient?.account_id ?? "");
  const [categoryId, setCategoryId] = React.useState(recipient?.category_id ?? "");
  const [notes, setNotes] = React.useState(recipient?.notes ?? "");
  const [submitting, setSubmitting] = React.useState(false);

  const canSave = name.trim().length > 0 && !submitting;

  const categoryOptions = React.useMemo(() => {
    const parents = new Map<string, Category[]>();
    for (const c of leafCats) {
      const pid = c.parent_id ?? "";
      const list = parents.get(pid) ?? [];
      list.push(c);
      parents.set(pid, list);
    }
    const entries: Array<{ value: string; label: React.ReactNode; searchText: string }> = [];
    for (const [parentId, children] of parents) {
      const parent = categories.find((c) => c.id === parentId);
      entries.push({
        value: parentId,
        label: (
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {parent?.name ?? text("No group", "Без групи")}
          </span>
        ),
        searchText: (parent?.name ?? text("No group", "Без групи")).toLowerCase(),
      });
      for (const c of children.sort((a, b) => a.name.localeCompare(b.name))) {
        entries.push({
          value: c.id,
          label: (
            <span className="flex items-center gap-2">
              <CategorySwatch icon={c.icon} color={c.color} className="size-4 rounded" />
              <span>{c.name}</span>
            </span>
          ),
          searchText: c.name.toLowerCase(),
        });
      }
    }
    return entries;
  }, [leafCats, categories, text]);

  const accountOptions = React.useMemo(
    () =>
      bookAccounts.map((a) => ({
        value: a.id,
        label: a.name,
        searchText: a.name.toLowerCase(),
      })),
    [bookAccounts]
  );

  const handleSave = async () => {
    if (!canSave) return;
    setSubmitting(true);
    try {
      if (isEdit && recipient) {
        await updateRecipient(recipient.id, {
          name: name.trim(),
          account_id: accountId || null,
          category_id: categoryId || null,
          notes: notes.trim() || null,
        });
        toast.success(text("Recipient updated", "Отримувача оновлено"));
      } else if (!isEdit) {
        await addRecipient({
          name: name.trim(),
          account_id: accountId || null,
          category_id: categoryId || null,
          notes: notes.trim() || null,
        });
        toast.success(text("Recipient added", "Отримувача додано"));
      }
      setName("");
      setAccountId("");
      setCategoryId("");
      setNotes("");
      setOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : text("Save error", "Помилка збереження")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Plus className="size-4" />
      {text("Add recipient", "Додати отримувача")}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger || !isControlled ? (
        <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? text("Edit recipient", "Редагувати отримувача")
              : text("New recipient", "Новий отримувач")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? text("Edit the recipient details.", "Відредагуйте дані отримувача.")
              : text(
                  "Add a recipient to the active budget book.",
                  "Додайте отримувача до активної книги бюджетування."
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
                placeholder={text("For example, Grocery Store", "Наприклад, Grocery Store")}
                autoFocus
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>{text("Account (optional)", "Рахунок (необовʼязково)")}</FieldLabel>
            <FieldContent>
              <SearchSelect
                value={accountId}
                onValueChange={setAccountId}
                options={accountOptions}
                placeholder={text("Select an account", "Виберіть рахунок")}
                emptyText={text("No accounts", "Порожньо")}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>{text("Category (optional)", "Категорія (необовʼязково)")}</FieldLabel>
            <FieldContent>
              <SearchSelect
                value={categoryId}
                onValueChange={setCategoryId}
                options={categoryOptions}
                placeholder={text("Select a category", "Оберіть категорію")}
                emptyText={text("No subcategories", "Підкатегорій немає")}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>{text("Notes", "Примітки")}</FieldLabel>
            <FieldContent>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={text("Additional information...", "Додаткова інформація...")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </FieldContent>
          </Field>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            {text("Cancel", "Скасувати")}
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {submitting
              ? text("Saving...", "Збереження…")
              : isEdit
                ? text("Save", "Зберегти")
                : text("Add", "Додати")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
