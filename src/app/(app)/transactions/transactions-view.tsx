"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PageHeading } from "@/components/page-heading";
import { AddTransactionDialog } from "@/components/transaction-dialog";
import { TypeBadge, AmountText } from "@/components/type-badge";
import { useData } from "@/lib/store";
import { formatDateLong } from "@/lib/format";

const LIMIT = 150;
type FilterKey = "type" | "account" | "category";

export function TransactionsView() {
  const { transactions, accounts, categories, activeBookId, activeBook } = useData();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = React.useState("");

  const type = searchParams.get("type") ?? "all";
  const accountId = searchParams.get("account") ?? "all";
  const categoryId = searchParams.get("category") ?? "all";

  const setFilter = (key: FilterKey, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    router.replace(qs ? `/transactions?${qs}` : "/transactions", { scroll: false });
  };

  const bookTransactions = React.useMemo(
    () =>
      transactions
        .filter((tx) => tx.budget_book_id === activeBookId)
        .sort((a, b) => (a.transaction_date < b.transaction_date ? 1 : a.transaction_date > b.transaction_date ? -1 : 0)),
    [transactions, activeBookId]
  );

  const accountName = React.useCallback(
    (id: string) => accounts.find((a) => a.id === id)?.name ?? "—",
    [accounts]
  );
  const categoryName = React.useCallback(
    (id?: string | null) => categories.find((c) => c.id === id)?.name ?? "",
    [categories]
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookTransactions.filter((tx) => {
      if (type !== "all" && tx.type !== type) return false;
      if (accountId !== "all" && tx.account_id !== accountId) return false;
      if (categoryId !== "all" && tx.category_id !== categoryId) return false;
      if (q) {
        const haystack =
          `${tx.note ?? ""} ${categoryName(tx.category_id)} ${accountName(tx.account_id)}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [bookTransactions, query, type, accountId, categoryId, categoryName, accountName]);

  const showMore = filtered.length > LIMIT;
  const visible = showMore ? filtered.slice(0, LIMIT) : filtered;

  const hasFilters =
    query.trim().length > 0 || type !== "all" || accountId !== "all" || categoryId !== "all";

  const resetFilters = () => {
    setQuery("");
    router.replace("/transactions");
  };

  const bookAccounts = accounts.filter((a) => a.budget_book_id === activeBookId);
  const bookCategories = categories.filter((c) => c.budget_book_id === activeBookId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="Транзакції"
        description={`${filtered.length} операцій у книзі «${activeBook?.name ?? "…"}»`}
        actions={<AddTransactionDialog />}
      />

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-72">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Пошук за описом, рахунком, категорією…"
                className="pl-8"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={type} onValueChange={(v) => setFilter("type", v)}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Усі типи</SelectItem>
                  <SelectItem value="expense">Витрати</SelectItem>
                  <SelectItem value="income">Доходи</SelectItem>
                  <SelectItem value="transfer">Перекази</SelectItem>
                </SelectContent>
              </Select>
              <Select value={accountId} onValueChange={(v) => setFilter("account", v)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Рахунок" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Усі рахунки</SelectItem>
                  {bookAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryId} onValueChange={(v) => setFilter("category", v)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Категорія" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Усі категорії</SelectItem>
                  {bookCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFilters ? (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <SlidersHorizontal />
                  Скинути фільтри
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <p className="text-sm font-medium">Нічого не знайдено</p>
              <p className="text-sm text-muted-foreground">
                Спробуйте змінити фільтри або пошуковий запит.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Опис</TableHead>
                    <TableHead>Категорія</TableHead>
                    <TableHead className="hidden md:table-cell">Рахунок</TableHead>
                    <TableHead className="hidden xl:table-cell">Книга</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead className="text-right">Сума</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateLong(tx.transaction_date)}
                      </TableCell>
                      <TableCell className="max-w-52 truncate font-medium">
                        {tx.note || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {categoryName(tx.category_id) || "—"}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {accountName(tx.account_id)}
                        {tx.type === "transfer" && tx.transfer_account_id
                          ? ` → ${accountName(tx.transfer_account_id)}`
                          : ""}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground xl:table-cell">
                        {activeBook?.name ?? '…'}
                      </TableCell>
                      <TableCell>
                        <TypeBadge type={tx.type} />
                      </TableCell>
                      <TableCell className="text-right">
                        {tx.type === "transfer" ? (
                          <AmountText
                            type={tx.type}
                            amount={tx.amount}
                            className="text-muted-foreground"
                          />
                        ) : (
                          <AmountText type={tx.type} amount={tx.amount} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {showMore ? (
                <p className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
                  Показано перші {LIMIT} із {filtered.length} операцій. Додайте фільтри, щоб звузити список.
                </p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}