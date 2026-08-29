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
import { toISODate } from "@/lib/format";
import type { TransactionType } from "@/lib/types";

export function AddTransactionDialog() {
  const { addTransaction, accounts, categories, activeBookId } = useData();

  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<TransactionType>("expense");
  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState(() => toISODate(new Date()));
  const [description, setDescription] = React.useState("");
  const [accountId, setAccountId] = React.useState("");
  const [toAccountId, setToAccountId] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");

  const bookAccounts = React.useMemo(
    () => accounts.filter((a) => a.budget_book_id === activeBookId),
    [accounts, activeBookId]
  );
  const bookCategories = React.useMemo(
    () => categories.filter((c) => c.budget_book_id === activeBookId && c.kind === type),
    [categories, activeBookId, type]
  );

  const amountValue = Number(amount);
  const amountValid = !Number.isNaN(amountValue) && amountValue > 0;
  const targetAccounts = bookAccounts.filter((a) => a.id !== accountId);
  const canSave =
    amountValid &&
    date.length > 0 &&
    accountId.length > 0 &&
    (type === "transfer" ? toAccountId.length > 0 : categoryId.length > 0);

  const handleSave = () => {
    if (!canSave) return;
    addTransaction({
      type,
      amount: Math.round(amountValue * 100) / 100,
      transaction_date: date,
      note: description.trim(),
      account_id: accountId,
      ...(type === "transfer"
        ? { transfer_account_id: toAccountId }
        : { category_id: categoryId }),
    });
    setOpen(false);
    reset();
  };

  const reset = () => {
    setType("expense");
    setAmount("");
    setDate(toISODate(new Date()));
    setDescription("");
    setAccountId("");
    setToAccountId("");
    setCategoryId("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Додати транзакцію
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Нова транзакція</DialogTitle>
          <DialogDescription>
            Додається в активну книгу бюджетування.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Тип</FieldLabel>
            <FieldContent>
              <Select
                value={type}
                onValueChange={(v) => setType(v as TransactionType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Витрата</SelectItem>
                  <SelectItem value="income">Дохід</SelectItem>
                  <SelectItem value="transfer">Переказ</SelectItem>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Сума</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {!amountValid && amount.length > 0 ? (
                  <FieldError>Введіть суму більше нуля</FieldError>
                ) : null}
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Дата</FieldLabel>
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
            <FieldLabel>Опис</FieldLabel>
            <FieldContent>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Додайте опис (необов’язково)"
              />
            </FieldContent>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>{type === "transfer" ? "З рахунку" : "Рахунок"}</FieldLabel>
              <FieldContent>
                <Select value={accountId} onValueChange={(v) => setAccountId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Оберіть рахунок" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            {type === "transfer" ? (
              <Field>
                <FieldLabel>На рахунок</FieldLabel>
                <FieldContent>
                  <Select value={toAccountId} onValueChange={(v) => setToAccountId(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Оберіть рахунок" />
                    </SelectTrigger>
                    <SelectContent>
                      {targetAccounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {toAccountId === accountId && toAccountId.length > 0 ? (
                    <FieldError>Рахунки мають відрізнятися</FieldError>
                  ) : null}
                </FieldContent>
              </Field>
            ) : (
              <Field>
                <FieldLabel>Категорія</FieldLabel>
                <FieldContent>
                  <Select value={categoryId} onValueChange={(v) => setCategoryId(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Оберіть категорію" />
                    </SelectTrigger>
                    <SelectContent>
                      {bookCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {categoryId.length === 0 && amountValid ? (
                    <FieldError>Оберіть категорію</FieldError>
                  ) : null}
                </FieldContent>
              </Field>
            )}
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Скасувати
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Зберегти
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}