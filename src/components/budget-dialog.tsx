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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useData } from "@/lib/store";
import { startOfMonth, toISODate } from "@/lib/format";

export function AddBudgetDialog() {
  const { addBudget, categories, budgets, activeBookId } = useData();

  const [open, setOpen] = React.useState(false);
  const [categoryId, setCategoryId] = React.useState("");
  const [limit, setLimit] = React.useState("");
  const [name, setName] = React.useState("");

  const expenseCategories = React.useMemo(
    () =>
      categories.filter(
        (c) => c.budget_book_id === activeBookId && c.kind === "expense"
      ),
    [categories, activeBookId]
  );
  const budgetedCategoryIds = new Set(budgets.map((b) => b.category_id));
  const available = expenseCategories.filter((c) => !budgetedCategoryIds.has(c.id));
  const selectedCategory = expenseCategories.find((c) => c.id === categoryId);

  const limitValue = Number(limit);
  const limitValid = !Number.isNaN(limitValue) && limitValue > 0;
  const canSave = categoryId.length > 0 && limitValid;

  const handleSave = () => {
    if (!canSave) return;
    addBudget({
      category_id: categoryId,
      amount_limit: Math.round(limitValue * 100) / 100,
      name: name.trim() || selectedCategory?.name || "Без назви",
      period_type: "monthly",
      start_date: toISODate(startOfMonth(new Date())),
    });
    setOpen(false);
    setCategoryId("");
    setLimit("");
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Додати бюджет
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новий бюджет</DialogTitle>
          <DialogDescription>
            Місячний ліміт витрат для вибраної категорії.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Категорія</FieldLabel>
            <FieldContent>
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Оберіть категорію" />
                </SelectTrigger>
                <SelectContent>
                  {available.length === 0 ? (
                    <p className="px-2 py-3 text-sm text-muted-foreground">
                      Усі категорії вже мають бюджет.
                    </p>
                  ) : (
                    available.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {categoryId.length === 0 && limit.length > 0 ? (
                <FieldError>Оберіть категорію</FieldError>
              ) : null}
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Місячний ліміт</FieldLabel>
            <FieldContent>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
              {!limitValid && limit.length > 0 ? (
                <FieldError>Ліміт має бути більше нуля</FieldError>
              ) : null}
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Назва (необов’язково)</FieldLabel>
            <FieldContent>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="За замовчуванням — назва категорії"
              />
            </FieldContent>
          </Field>
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Скасувати
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Створити бюджет
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}