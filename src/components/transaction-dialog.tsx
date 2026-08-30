"use client";

import * as React from "react";
import { Pencil, Plus } from "lucide-react";

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
import { SearchSelect } from "@/components/search-select";

import { useData } from "@/lib/store";
import { toISODate } from "@/lib/format";
import { leafCategories } from "@/lib/categories";
import { CategorySwatch } from "@/components/category-looks";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";
import type { Transaction, TransactionType } from "@/lib/types";

export type TransactionDialogMode = "create" | "edit";

export function TransactionDialog({
  mode,
  transaction,
  trigger,
  open,
  onOpenChange,
}: {
  mode: TransactionDialogMode;
  transaction?: Transaction;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const {
    addTransaction,
    updateTransaction,
    accounts,
    categories,
    recipients,
    tags,
    activeBookId,
  } = useData();
  const { text } = useLanguage();
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (isControlled) {
        onOpenChange?.(next);
      } else {
        setInternalOpen(next);
      }
    },
    [isControlled, onOpenChange]
  );

  const isEdit = mode === "edit";

  const [submitting, setSubmitting] = React.useState(false);
  const [type, setType] = React.useState<TransactionType>(
    transaction?.type ?? "expense"
  );
  const [amount, setAmount] = React.useState(
    transaction ? String(transaction.amount) : ""
  );
  const [date, setDate] = React.useState(
    transaction?.transaction_date ?? toISODate(new Date())
  );
  const [description, setDescription] = React.useState(transaction?.note ?? "");
  const [accountId, setAccountId] = React.useState(transaction?.account_id ?? "");
  const [toAccountId, setToAccountId] = React.useState(
    transaction?.transfer_account_id ?? ""
  );
  const [categoryId, setCategoryId] = React.useState(
    transaction?.category_id ?? ""
  );
  const [recipientId, setRecipientId] = React.useState(
    transaction?.recipient_id ?? ""
  );
  const [tagId, setTagId] = React.useState(transaction?.tag_id ?? "");

  const bookAccounts = React.useMemo(
    () => accounts.filter((a) => a.budget_book_id === activeBookId),
    [accounts, activeBookId]
  );
  const bookCategories = React.useMemo(
    () =>
      leafCategories(
        categories,
        activeBookId,
        type === "transfer" ? undefined : type
      ),
    [categories, activeBookId, type]
  );
  const bookRecipients = React.useMemo(
    () => recipients.filter((r) => r.budget_book_id === activeBookId),
    [recipients, activeBookId]
  );
  const bookTags = React.useMemo(
    () => tags.filter((t) => t.budget_book_id === activeBookId),
    [tags, activeBookId]
  );
  const parentName = React.useCallback(
    (parentId: string | null) =>
      categories.find((c) => c.id === parentId)?.name ?? "",
    [categories]
  );

  const amountValue = Number(amount);
  const amountValid = !Number.isNaN(amountValue) && amountValue > 0;
  const targetAccounts = bookAccounts.filter((a) => a.id !== accountId);
  const transactionTypeOptions = React.useMemo(
    () => [
      {
        value: "expense",
        label: text("Expense", "Витрата"),
        searchText: "expense витрата",
      },
      {
        value: "income",
        label: text("Income", "Дохід"),
        searchText: "income дохід",
      },
      {
        value: "transfer",
        label: text("Transfer", "Переказ"),
        searchText: "transfer переказ",
      },
    ],
    [text]
  );
  const accountOptions = React.useMemo(
    () =>
      bookAccounts.map((a) => ({
        value: a.id,
        label: a.name,
        searchText: `${a.name} ${a.currency} ${a.type}`.toLowerCase(),
      })),
    [bookAccounts]
  );
  const targetAccountOptions = React.useMemo(
    () =>
      targetAccounts.map((a) => ({
        value: a.id,
        label: a.name,
        searchText: `${a.name} ${a.currency} ${a.type}`.toLowerCase(),
      })),
    [targetAccounts]
  );
  const categoryOptions = React.useMemo(
    () =>
      bookCategories.map((c) => {
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
    [bookCategories, parentName]
  );
  const canSave =
    amountValid &&
    date.length > 0 &&
    accountId.length > 0 &&
    (type === "transfer" ? toAccountId.length > 0 : categoryId.length > 0);

  const reset = () => {
    setType("expense");
    setAmount("");
    setDate(toISODate(new Date()));
    setDescription("");
    setAccountId("");
    setToAccountId("");
    setCategoryId("");
    setRecipientId("");
    setTagId("");
  };

  const handleSave = async () => {
    if (!canSave || submitting) return;
    setSubmitting(true);
    try {
      if (isEdit && transaction) {
        await updateTransaction(transaction.id, {
          type,
          amount: Math.round(amountValue * 100) / 100,
          transaction_date: date,
          note: description.trim() || null,
          account_id: accountId,
          recipient_id: recipientId || null,
          tag_id: tagId || null,
          ...(type === "transfer"
            ? { transfer_account_id: toAccountId, category_id: null }
            : { category_id: categoryId, transfer_account_id: null }),
        });
        toast.success(text("Transaction updated", "Транзакцію оновлено"));
      } else {
        await addTransaction({
          type,
          amount: Math.round(amountValue * 100) / 100,
          transaction_date: date,
          note: description.trim(),
          account_id: accountId,
          recipient_id: recipientId || undefined,
          tag_id: tagId || undefined,
          ...(type === "transfer"
            ? { transfer_account_id: toAccountId }
            : { category_id: categoryId }),
        });
        toast.success(text("Transaction added", "Транзакцію додано"));
      }
      setOpen(false);
      if (!isEdit) reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : text("Save error", "Помилка збереження"));
    } finally {
      setSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button>
      <Plus />
      {text("Add transaction", "Додати транзакцію")}
    </Button>
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (submitting) return;
        setOpen(next);
        if (!next && !isEdit) reset();
      }}
    >
      {trigger || !isControlled ? (
        <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? text("Edit transaction", "Редагувати транзакцію")
              : text("New transaction", "Нова транзакція")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? text("Update the transaction details.", "Оновіть дані транзакції.")
              : text(
                  "The transaction will be added to the active budget book.",
                  "Додається в активну книгу бюджетування."
                )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>{text("Type", "Тип")}</FieldLabel>
            <FieldContent>
              <SearchSelect
                value={type}
                onValueChange={(v) => setType(v as TransactionType)}
                options={transactionTypeOptions}
                searchPlaceholder={text("Search transaction type...", "Пошук типу транзакції…")}
              />
            </FieldContent>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>{text("Amount", "Сума")}</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {!amountValid && amount.length > 0 ? (
                  <FieldError>
                    {text("Enter an amount greater than zero", "Введіть суму більше нуля")}
                  </FieldError>
                ) : null}
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>{text("Date", "Дата")}</FieldLabel>
              <FieldContent>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </FieldContent>
            </Field>
          </div>

          <Field>
            <FieldLabel>{text("Description", "Опис")}</FieldLabel>
            <FieldContent>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={text(
                  "Add a description (optional)",
                  "Додайте опис (необов’язково)"
                )}
              />
            </FieldContent>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>
                {type === "transfer"
                  ? text("From account", "З рахунку")
                  : text("Account", "Рахунок")}
              </FieldLabel>
              <FieldContent>
                <SearchSelect
                  value={accountId}
                  onValueChange={(v) => setAccountId(v)}
                  options={accountOptions}
                  placeholder={text("Select an account", "Оберіть рахунок")}
                  searchPlaceholder={text("Search accounts...", "Пошук рахунків…")}
                  emptyText={text("No accounts found", "Рахунків не знайдено")}
                />
              </FieldContent>
            </Field>

            {type === "transfer" ? (
              <Field>
                <FieldLabel>{text("To account", "На рахунок")}</FieldLabel>
                <FieldContent>
                  <SearchSelect
                    value={toAccountId}
                    onValueChange={(v) => setToAccountId(v)}
                    options={targetAccountOptions}
                    placeholder={text("Select an account", "Оберіть рахунок")}
                    searchPlaceholder={text("Search accounts...", "Пошук рахунків…")}
                    emptyText={text("No accounts found", "Рахунків не знайдено")}
                  />
                  {toAccountId === accountId && toAccountId.length > 0 ? (
                    <FieldError>
                      {text("Accounts must be different", "Рахунки мають відрізнятися")}
                    </FieldError>
                  ) : null}
                </FieldContent>
              </Field>
            ) : (
              <Field>
                <FieldLabel>{text("Category", "Категорія")}</FieldLabel>
                <FieldContent>
                  <SearchSelect
                    value={categoryId}
                    onValueChange={(v) => setCategoryId(v)}
                    options={categoryOptions}
                    placeholder={text("Select a category", "Оберіть категорію")}
                    searchPlaceholder={text("Search categories...", "Пошук категорій…")}
                    emptyText={text(
                      "There are no subcategories for this type.",
                      "Немає підкатегорій для цього типу."
                    )}
                  />
                  {categoryId.length === 0 && amountValid ? (
                    <FieldError>{text("Select a category", "Оберіть категорію")}</FieldError>
                  ) : null}
                </FieldContent>
              </Field>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>
                {text("Recipient (optional)", "Отримувач (необовʼязково)")}
              </FieldLabel>
              <FieldContent>
                <SearchSelect
                  value={recipientId}
                  onValueChange={(v) => setRecipientId(v === "__none__" ? "" : v)}
                  options={[
                    {
                      value: "__none__",
                      label: (
                        <span className="text-muted-foreground">
                          {text("None", "Без отримувача")}
                        </span>
                      ),
                      searchText: text(
                        "none no recipient without",
                        "без отримувача немає пусто"
                      ),
                    },
                    ...bookRecipients.map((r) => {
                      const cat = r.category;
                      const account = r.account;
                      const meta = [cat?.name, account?.name].filter(Boolean).join(" ");
                      return {
                        value: r.id,
                        label: (
                          <span className="flex items-center gap-2">
                            {cat ? (
                              <CategorySwatch
                                icon={cat.icon}
                                color={cat.color}
                                className="size-4 rounded"
                              />
                            ) : null}
                            <span className="truncate">{r.name}</span>
                            {account ? (
                              <span className="text-xs text-muted-foreground">
                                · {account.name}
                              </span>
                            ) : null}
                          </span>
                        ),
                        searchText: `${r.name} ${meta} ${r.notes ?? ""}`.toLowerCase(),
                      };
                    }),
                  ]}
                  placeholder={text(
                    "Select a recipient",
                    "Оберіть отримувача"
                  )}
                  searchPlaceholder={text(
                    "Search recipients…",
                    "Пошук отримувачів…"
                  )}
                  emptyText={text(
                    "No recipients yet. Add one in Settings.",
                    "Отримувачів ще немає. Додайте у Налаштуваннях."
                  )}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>
                {text("Tag (optional)", "Тег (необовʼязково)")}
              </FieldLabel>
              <FieldContent>
                <SearchSelect
                  value={tagId}
                  onValueChange={(v) => setTagId(v === "__none__" ? "" : v)}
                  options={[
                    {
                      value: "__none__",
                      label: (
                        <span className="text-muted-foreground">
                          {text("None", "Без тегу")}
                        </span>
                      ),
                      searchText: text(
                        "none no tag without",
                        "без тегу немає пусто"
                      ),
                    },
                    ...bookTags.map((t) => ({
                      value: t.id,
                      label: (
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: t.color ?? "#6b7280" }}
                          />
                          <span className="truncate">{t.name}</span>
                        </span>
                      ),
                      searchText: t.name.toLowerCase(),
                    })),
                  ]}
                  placeholder={text("Select a tag", "Оберіть тег")}
                  searchPlaceholder={text("Search tags…", "Пошук тегів…")}
                  emptyText={text(
                    "No tags yet. Add one in Settings.",
                    "Тегів ще немає. Додайте у Налаштуваннях."
                  )}
                />
              </FieldContent>
            </Field>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            {isEdit ? text("Close", "Закрити") : text("Cancel", "Скасувати")}
          </Button>
          <Button onClick={handleSave} disabled={!canSave || submitting}>
            {submitting
              ? text("Saving...", "Збереження…")
              : isEdit
                ? text("Save", "Зберегти")
                : text("Save", "Зберегти")}
            {submitting ? null : isEdit ? <Pencil className="ml-1" /> : null}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddTransactionDialog() {
  return <TransactionDialog mode="create" />;
}
