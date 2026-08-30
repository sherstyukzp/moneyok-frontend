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
import { MultiSearchSelect } from "@/components/search-select";

import { useData } from "@/lib/store";
import { startOfMonth, toISODate } from "@/lib/format";
import { leafCategories } from "@/lib/categories";
import { CategorySwatch } from "@/components/category-looks";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

export function AddBudgetDialog() {
  const { addBudgets, categories, budgets, activeBookId } = useData();
  const { text } = useLanguage();

  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [categoryIds, setCategoryIds] = React.useState<string[]>([]);
  const [limit, setLimit] = React.useState("");
  const [name, setName] = React.useState("");

  const expenseCategories = React.useMemo(
    () => leafCategories(categories, activeBookId, "expense"),
    [categories, activeBookId]
  );
  const budgetedCategoryIds = React.useMemo(
    () => new Set(budgets.map((b) => b.category_id)),
    [budgets]
  );
  const available = React.useMemo(
    () => expenseCategories.filter((c) => !budgetedCategoryIds.has(c.id)),
    [expenseCategories, budgetedCategoryIds]
  );
  const parentName = React.useCallback(
    (parentId: string | null) =>
      categories.find((c) => c.id === parentId)?.name ?? "",
    [categories]
  );
  const selectedCategories = React.useMemo(
    () => available.filter((c) => categoryIds.includes(c.id)),
    [available, categoryIds]
  );
  const categoryOptions = React.useMemo(
    () =>
      available.map((c) => {
        const groupName = parentName(c.parent_id);
        return {
          value: c.id,
          label: (
            <span className="flex min-w-0 items-center gap-2">
              <CategorySwatch
                icon={c.icon}
                color={c.color}
                className="size-5 rounded"
              />
              <span className="truncate">{c.name}</span>
              {groupName ? (
                <span className="truncate text-xs text-muted-foreground">
                  · {groupName}
                </span>
              ) : null}
            </span>
          ),
          searchText: `${c.name} ${groupName}`.toLowerCase(),
        };
      }),
    [available, parentName]
  );

  const limitValue = Number(limit);
  const limitValid = !Number.isNaN(limitValue) && limitValue > 0;
  const canSave = selectedCategories.length > 0 && limitValid && !submitting;

  const handleSave = async () => {
    if (!canSave) return;
    setSubmitting(true);
    try {
      const startDate = toISODate(startOfMonth(new Date()));
      const amountLimit = Math.round(limitValue * 100) / 100;
      await addBudgets(
        selectedCategories.map((category) => ({
          category_id: category.id,
          amount_limit: amountLimit,
          name: name.trim() || category.name || text("Untitled", "Без назви"),
          period_type: "monthly",
          start_date: startDate,
        }))
      );
      toast.success(
        selectedCategories.length === 1
          ? text("Budget created", "Бюджет створено")
          : text(
              `${selectedCategories.length} budgets created`,
              `Створено бюджетів: ${selectedCategories.length}`
            )
      );
      setOpen(false);
      setCategoryIds([]);
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
              <MultiSearchSelect
                value={categoryIds}
                onValueChange={setCategoryIds}
                options={categoryOptions}
                placeholder={text("Select categories", "Оберіть категорії")}
                searchPlaceholder={text("Search categories...", "Пошук категорій…")}
                emptyText={text(
                  "All subcategories already have a budget.",
                  "Усі підкатегорії вже мають бюджет."
                )}
                disabled={available.length === 0}
              />
              {selectedCategories.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedCategories.map((category) => (
                    <span
                      key={category.id}
                      className="inline-flex min-w-0 items-center gap-1 rounded-md border bg-muted px-2 py-1 text-xs"
                    >
                      <CategorySwatch
                        icon={category.icon}
                        color={category.color}
                        className="size-4 rounded"
                      />
                      <span className="max-w-32 truncate">{category.name}</span>
                    </span>
                  ))}
                </div>
              ) : null}
              {selectedCategories.length === 0 && limit.length > 0 ? (
                <FieldError>{text("Select at least one category", "Оберіть хоча б одну категорію")}</FieldError>
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
