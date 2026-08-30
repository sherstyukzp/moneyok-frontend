"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useData } from "@/lib/store";
import { startOfMonth, toISODate } from "@/lib/format";
import { leafCategories } from "@/lib/categories";
import { CategorySwatch } from "@/components/category-looks";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

export function AddBudgetDialog() {
  const { addBudget, categories, budgets, activeBookId } = useData();
  const { text } = useLanguage();

  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [categoryId, setCategoryId] = React.useState("");
  const [limit, setLimit] = React.useState("");
  const [name, setName] = React.useState("");

  const expenseCategories = React.useMemo(
    () => leafCategories(categories, activeBookId, "expense"),
    [categories, activeBookId]
  );
  const budgetedCategoryIds = new Set(budgets.map((b) => b.category_id));
  const available = expenseCategories.filter((c) => !budgetedCategoryIds.has(c.id));
  const selectedCategory = expenseCategories.find((c) => c.id === categoryId);

  const parentName = React.useCallback(
    (parentId: string | null) =>
      categories.find((c) => c.id === parentId)?.name ?? "",
    [categories]
  );
  const parentGroups = React.useMemo(() => {
    const groups = new Map<string, typeof available>();
    for (const c of available) {
      const pid = c.parent_id ?? "";
      const list = groups.get(pid) ?? [];
      list.push(c);
      groups.set(pid, list);
    }
    return Array.from(groups.entries());
  }, [available]);

  const limitValue = Number(limit);
  const limitValid = !Number.isNaN(limitValue) && limitValue > 0;
  const canSave = categoryId.length > 0 && limitValid && !submitting;

  const handleSave = async () => {
    if (!canSave) return;
    setSubmitting(true);
    try {
      await addBudget({
        category_id: categoryId,
        amount_limit: Math.round(limitValue * 100) / 100,
        name: name.trim() || selectedCategory?.name || text("Untitled", "Без назви"),
        period_type: "monthly",
        start_date: toISODate(startOfMonth(new Date())),
      });
      toast.success(text("Budget created", "Бюджет створено"));
      setOpen(false);
      setCategoryId("");
      setLimit("");
      setName("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : text("Save error", "Помилка збереження")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && setOpen(next)}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          {text("Add budget", "Додати бюджет")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{text("New budget", "Новий бюджет")}</DialogTitle>
          <DialogDescription>
            {text(
              "A monthly spending limit for the selected category.",
              "Місячний ліміт витрат для вибраної категорії."
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>{text("Category", "Категорія")}</FieldLabel>
            <FieldContent>
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={text("Select a category", "Оберіть категорію")} />
                </SelectTrigger>
                <SelectContent>
                  {available.length === 0 ? (
                    <p className="px-2 py-3 text-sm text-muted-foreground">
                      {text(
                        "All subcategories already have a budget.",
                        "Усі підкатегорії вже мають бюджет."
                      )}
                    </p>
                  ) : (
                    parentGroups.map(([parentId, items], index) => (
                      <React.Fragment key={parentId}>
                        {index > 0 ? <SelectSeparator /> : null}
                        <SelectGroup>
                          <SelectLabel>
                            {parentName(parentId) || text("No group", "Без групи")}
                          </SelectLabel>
                          {items.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              <span className="flex items-center gap-2">
                                <CategorySwatch
                                  icon={c.icon}
                                  color={c.color}
                                  className="size-5 rounded"
                                />
                                {c.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </React.Fragment>
                    ))
                  )}
                </SelectContent>
              </Select>
              {categoryId.length === 0 && limit.length > 0 ? (
                <FieldError>{text("Select a category", "Оберіть категорію")}</FieldError>
              ) : null}
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>{text("Monthly limit", "Місячний ліміт")}</FieldLabel>
            <FieldContent>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
              {!limitValid && limit.length > 0 ? (
                <FieldError>
                  {text("The limit must be greater than zero", "Ліміт має бути більше нуля")}
                </FieldError>
              ) : null}
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>{text("Name (optional)", "Назва (необов’язково)")}</FieldLabel>
            <FieldContent>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={text(
                  "Defaults to the category name",
                  "За замовчуванням — назва категорії"
                )}
              />
            </FieldContent>
          </Field>
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            {text("Cancel", "Скасувати")}
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {submitting ? text("Creating...", "Створення…") : text("Create budget", "Створити бюджет")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
