"use client";

import * as React from "react";
import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  Loader,
  Lock,
  Pencil,
  Trash2,
  TriangleAlert,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldDescription,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/confirm-dialog";

import { useData } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { currencySymbol } from "@/lib/format";
import { toast } from "sonner";
import type { Account, AccountType } from "@/lib/types";
import {
  ACCOUNT_COLOR_OPTIONS,
  ACCOUNT_DEFAULT_LOOKS,
  AccountIcon,
} from "@/components/account-looks";

const TOP_CURRENCIES = ["UAH", "USD", "EUR", "GBP", "PLN", "CZK"] as const;
const OTHER_CURRENCY = "__other__";
const MAX_BALANCE = 999_999_999_999.99;
const MAX_NAME_LENGTH = 60;
const MAX_NOTE_LENGTH = 280;
const CURRENCY_REGEX = /^[A-Z]{3}$/;

type FormState = {
  name: string;
  type: AccountType;
  currency: string;
  customCurrency: string;
  color: string;
  note: string;
  initialBalance: string;
  currentBalance: string;
  currentBalancePristine: boolean;
};

function buildInitialState(
  account: Account | undefined,
  defaultCurrency: string,
): FormState {
  if (account) {
    const baseCurrency = account.currency || defaultCurrency;
    const isTop = (TOP_CURRENCIES as ReadonlyArray<string>).includes(baseCurrency);
    return {
      name: account.name ?? "",
      type: account.type,
      currency: isTop ? baseCurrency : OTHER_CURRENCY,
      customCurrency: isTop ? "" : baseCurrency,
      color: account.color ?? ACCOUNT_DEFAULT_LOOKS[account.type].color,
      note: account.note ?? "",
      initialBalance: formatBalance(account.initial_balance),
      currentBalance: formatBalance(account.current_balance),
      currentBalancePristine: false,
    };
  }
  return {
    name: "",
    type: "payment",
    currency: defaultCurrency,
    customCurrency: "",
    color: ACCOUNT_DEFAULT_LOOKS.payment.color,
    note: "",
    initialBalance: "0",
    currentBalance: "0",
    currentBalancePristine: true,
  };
}

function formatBalance(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}

function parseBalance(raw: string): number | null {
  if (raw.trim().length === 0) return null;
  const normalized = raw.replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100) / 100;
}

function canSaveForm(state: FormState): boolean {
  if (state.name.trim().length === 0) return false;
  if (state.name.trim().length > MAX_NAME_LENGTH) return false;
  const resolvedCurrency =
    state.currency === OTHER_CURRENCY
      ? state.customCurrency.trim().toUpperCase()
      : state.currency;
  if (!resolvedCurrency || !CURRENCY_REGEX.test(resolvedCurrency)) return false;
  const initial = parseBalance(state.initialBalance);
  if (initial === null || initial < 0 || initial > MAX_BALANCE) return false;
  const current = parseBalance(state.currentBalance);
  if (current === null || current < 0 || current > MAX_BALANCE) return false;
  return true;
}

function resolveCurrency(state: FormState): string | null {
  const value =
    state.currency === OTHER_CURRENCY
      ? state.customCurrency.trim().toUpperCase()
      : state.currency;
  return CURRENCY_REGEX.test(value) ? value : null;
}

function formsEqual(a: FormState, b: FormState): boolean {
  return (
    a.name === b.name &&
    a.type === b.type &&
    a.currency === b.currency &&
    a.customCurrency === b.customCurrency &&
    a.color === b.color &&
    a.note === b.note &&
    a.initialBalance === b.initialBalance &&
    a.currentBalance === b.currentBalance &&
    a.currentBalancePristine === b.currentBalancePristine
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

export type AccountDialogMode = "create" | "edit";

export function AccountDialog({
  mode,
  account,
  trigger,
  triggerInline = false,
  open,
  onOpenChange,
}: {
  mode: AccountDialogMode;
  account?: Account;
  trigger?: React.ReactNode;
  triggerInline?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { addAccount, updateAccount, deleteAccount, currency } = useData();
  const { text, language } = useLanguage();
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
  const isArchived = !!account?.archived_at;

  const [{ form, initial }, setFormState] = React.useState(() => {
    const initial = buildInitialState(account, currency);
    return { form: initial, initial };
  });
  const setForm = React.useCallback(
    (updater: FormState | ((prev: FormState) => FormState)) => {
      setFormState((prev) =>
        typeof updater === "function"
          ? { ...prev, form: (updater as (p: FormState) => FormState)(prev.form) }
          : { ...prev, form: updater }
      );
    },
    []
  );
  const resetForm = React.useCallback((nextInitial: FormState) => {
    setFormState({ form: nextInitial, initial: nextInitial });
  }, []);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);
  const [confirmArchive, setConfirmArchive] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [archivePending, setArchivePending] = React.useState(false);
  const [restorePending, setRestorePending] = React.useState(false);
  const [deletePending, setDeletePending] = React.useState(false);
  const [archiveOpen, setArchiveOpen] = React.useState(false);

  const dirty = !formsEqual(form, initial);

  const handleClose = React.useCallback(
    (next: boolean) => {
      if (!next) {
        if (dirty && !submitting) {
          setConfirmDiscard(true);
          return;
        }
        if (!isEdit) {
          resetForm(buildInitialState(undefined, currency));
        }
      }
      setOpen(next);
    },
    [dirty, submitting, isEdit, currency, setOpen, resetForm]
  );

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTypeChange = (next: AccountType) => {
    const defaults = ACCOUNT_DEFAULT_LOOKS[next];
    setForm((prev) => {
      const previousDefault =
        ACCOUNT_DEFAULT_LOOKS[prev.type].color === prev.color;
      return {
        ...prev,
        type: next,
        color: previousDefault ? defaults.color : prev.color,
      };
    });
  };

  const handleInitialChange = (raw: string) => {
    setForm((prev) => {
      const next: FormState = { ...prev, initialBalance: raw };
      if (prev.currentBalancePristine) {
        next.currentBalance = raw;
      }
      return next;
    });
  };

  const handleCurrentChange = (raw: string) => {
    setForm((prev) => ({
      ...prev,
      currentBalance: raw,
      currentBalancePristine: false,
    }));
  };

  const isArchivedLocked = isEdit && isArchived;
  const fieldsDisabled = submitting || archivePending || restorePending;
  const formValid = canSaveForm(form);
  const resolvedCurrency = resolveCurrency(form);
  const canSubmit =
    formValid &&
    !!resolvedCurrency &&
    !fieldsDisabled &&
    !isArchivedLocked &&
    (isEdit ? dirty : true);

  const onSubmit = async () => {
    if (!formValid || !resolvedCurrency) return;
    if (isArchivedLocked) return;
    setSubmitting(true);
    setSubmitError(null);
    const opening = parseBalance(form.initialBalance) ?? 0;
    const current = parseBalance(form.currentBalance) ?? 0;
    const noteValue = form.note.trim().length > 0 ? form.note.trim() : null;
    try {
      const defaults = ACCOUNT_DEFAULT_LOOKS[form.type];
      if (isEdit && account) {
        await updateAccount(account.id, {
          name: form.name.trim(),
          type: form.type,
          currency: resolvedCurrency,
          color: form.color,
          icon: account.icon ?? defaults.icon,
          note: noteValue,
          initial_balance: opening,
          current_balance: current,
        });
        toast.success(text("Account updated", "Рахунок оновлено"));
      } else {
        await addAccount({
          name: form.name.trim(),
          type: form.type,
          initial_balance: opening,
          current_balance: current,
          currency: resolvedCurrency,
          color: form.color,
          icon: defaults.icon,
          note: noteValue,
        });
        toast.success(text("Account added", "Рахунок додано"));
      }
      if (!isEdit) {
        resetForm(buildInitialState(undefined, currency));
      }
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : text("Save error", "Помилка збереження");
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!account) return;
    setArchivePending(true);
    setSubmitError(null);
    try {
      await updateAccount(account.id, {
        archived_at: new Date().toISOString(),
      });
      toast.success(text("Account archived", "Рахунок архівовано"));
      setConfirmArchive(false);
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : text("Archive error", "Помилка архівування");
      setSubmitError(message);
      toast.error(message);
    } finally {
      setArchivePending(false);
    }
  };

  const handleRestore = async () => {
    if (!account) return;
    setRestorePending(true);
    setSubmitError(null);
    try {
      await updateAccount(account.id, { archived_at: null });
      toast.success(text("Account restored", "Рахунок відновлено"));
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : text("Restore error", "Помилка відновлення");
      setSubmitError(message);
      toast.error(message);
    } finally {
      setRestorePending(false);
    }
  };

  const handleDelete = async () => {
    if (!account) return;
    setDeletePending(true);
    setSubmitError(null);
    try {
      await deleteAccount(account.id);
      toast.success(text("Account deleted", "Рахунок видалено"));
      setConfirmDelete(false);
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : text("Delete error", "Помилка видалення");
      setSubmitError(message);
      toast.error(message);
    } finally {
      setDeletePending(false);
    }
  };

  const defaultTrigger = triggerInline ? (
    <button className="flex h-7 w-full items-center gap-2 rounded-md px-2 text-xs text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring">
      {text("Add account", "Додати рахунок")}
    </button>
  ) : (
    <Button variant="outline" size="sm">
      {text("Add account", "Додати рахунок")}
    </Button>
  );

  const activeCurrency =
    form.currency === OTHER_CURRENCY ? form.customCurrency.trim().toUpperCase() : form.currency;
  const currencyPrefix = currencySymbol(activeCurrency || "USD");

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      {trigger || !isControlled ? (
        <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      ) : null}
      <DialogContent
        className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        onInteractOutside={(e) => {
          if (dirty && !submitting) {
            e.preventDefault();
            setConfirmDiscard(true);
          }
        }}
        onEscapeKeyDown={(e) => {
          if (dirty && !submitting) {
            e.preventDefault();
            setConfirmDiscard(true);
          }
        }}
      >
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>
            {isEdit
              ? text(`Edit account: ${account?.name ?? ""}`, `Редагувати: ${account?.name ?? ""}`)
              : text("New account", "Новий рахунок")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? text("Update the account details.", "Оновіть дані рахунку.")
              : text(
                  "The account will be added to the active budget book.",
                  "Рахунок буде додано в активну книгу бюджетування."
                )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-5">
            <Field>
              <FieldLabel>{text("Account name", "Назва рахунку")}</FieldLabel>
              <FieldContent>
                <Input
                  value={form.name}
                  maxLength={MAX_NAME_LENGTH}
                  placeholder={text("Monobank", "Monobank")}
                  autoComplete="off"
                  disabled={isArchivedLocked || fieldsDisabled}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </FieldContent>
            </Field>

            <div className="flex flex-col gap-3">
              <SectionHeading>{text("General", "Загальні")}</SectionHeading>
              <Field>
                <FieldLabel>{text("Account type", "Тип рахунку")}</FieldLabel>
                <FieldContent>
                  <Select
                    value={form.type}
                    onValueChange={(v) => handleTypeChange(v as AccountType)}
                    disabled={isArchivedLocked || fieldsDisabled}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ACCOUNT_DEFAULT_LOOKS).map(
                        ([value, { icon: iconName, label, color }]) => {
                          const [labelEn, labelUk] = label;
                          return (
                            <SelectItem key={value} value={value}>
                              <span className="flex items-center gap-2">
                                <span
                                  className="flex size-5 shrink-0 items-center justify-center rounded"
                                  style={{
                                    backgroundColor: `${color}1f`,
                                    color,
                                  }}
                                >
                                  <AccountIcon name={iconName} className="size-3.5" />
                                </span>
                                {text(labelEn, labelUk)}
                              </span>
                            </SelectItem>
                          );
                        }
                      )}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{text("Currency", "Валюта")}</FieldLabel>
                <FieldContent>
                  <Select
                    value={form.currency}
                    onValueChange={(v) => updateField("currency", v)}
                    disabled={isArchivedLocked || fieldsDisabled}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TOP_CURRENCIES.map((code) => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                      <SelectItem value={OTHER_CURRENCY}>
                        {text("Other…", "Інша…")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {form.currency === OTHER_CURRENCY ? (
                    <Input
                      value={form.customCurrency}
                      maxLength={3}
                      placeholder="ISO"
                      autoCapitalize="characters"
                      autoComplete="off"
                      className="mt-1 uppercase"
                      disabled={isArchivedLocked || fieldsDisabled}
                      onChange={(e) =>
                        updateField(
                          "customCurrency",
                          e.target.value.toUpperCase().slice(0, 3)
                        )
                      }
                    />
                  ) : null}
                </FieldContent>
              </Field>
            </div>

            <div className="flex flex-col gap-3">
              <SectionHeading>{text("Color", "Колір")}</SectionHeading>
              <Field>
                <FieldContent>
                  <div className="flex flex-wrap gap-1.5">
                    {ACCOUNT_COLOR_OPTIONS.map((swatch) => {
                      const active = form.color.toLowerCase() === swatch.toLowerCase();
                      return (
                        <button
                          key={swatch}
                          type="button"
                          aria-label={swatch}
                          disabled={isArchivedLocked || fieldsDisabled}
                          onClick={() => updateField("color", swatch)}
                          className={cn(
                            "size-6 rounded-full border border-black/10 transition-transform outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            active
                              ? "scale-110 ring-2 ring-ring ring-offset-2 ring-offset-background"
                              : "hover:scale-110",
                            (isArchivedLocked || fieldsDisabled) &&
                              "cursor-not-allowed opacity-60"
                          )}
                          style={{ backgroundColor: swatch }}
                        />
                      );
                    })}
                  </div>
                </FieldContent>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>{text("Initial balance", "Початковий баланс")}</FieldLabel>
                <FieldContent>
                  <div className="relative">
                    <span className="text-muted-foreground pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm">
                      {currencyPrefix}
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      max={MAX_BALANCE}
                      value={form.initialBalance}
                      disabled={isArchivedLocked || fieldsDisabled}
                      onChange={(e) => handleInitialChange(e.target.value)}
                      className="pl-7"
                    />
                  </div>
                  <FieldDescription>
                    {text("Balance when adding the account", "Баланс на момент додавання рахунку")}
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>
                  <span className="inline-flex items-center gap-1">
                    {text("Current balance", "Загальний баланс")}
                    {isArchivedLocked ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Lock className="size-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          {text(
                            "Unarchive the account to edit balance",
                            "Розархівуйте рахунок, щоб коригувати баланс"
                          )}
                        </TooltipContent>
                      </Tooltip>
                    ) : null}
                  </span>
                </FieldLabel>
                <FieldContent>
                  <div className="relative">
                    <span className="text-muted-foreground pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm">
                      {currencyPrefix}
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      max={MAX_BALANCE}
                      value={form.currentBalance}
                      disabled={isArchivedLocked || fieldsDisabled}
                      readOnly={isArchivedLocked}
                      onChange={(e) => handleCurrentChange(e.target.value)}
                      className={cn("pl-7", isArchivedLocked && "bg-muted/50")}
                      title={
                        isArchivedLocked
                          ? text(
                              "Unarchive the account to edit balance",
                              "Розархівуйте рахунок, щоб коригувати баланс"
                            )
                          : undefined
                      }
                    />
                  </div>
                  <FieldDescription>
                    {isArchivedLocked
                      ? text(
                          "Balance is frozen while archived",
                          "Баланс заморожений, поки рахунок у архіві"
                        )
                      : form.currentBalancePristine
                        ? text(
                            "Synced with initial balance",
                            "Синхронізовано з початковим балансом"
                          )
                        : text(
                            "Reconciled value, used as the new baseline",
                            "Уточнене значення, новий базовий рівень"
                          )}
                  </FieldDescription>
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel>{text("Note", "Примітка")}</FieldLabel>
              <FieldContent>
                <textarea
                  value={form.note}
                  maxLength={MAX_NOTE_LENGTH}
                  rows={2}
                  placeholder={text("Optional", "Необовʼязково")}
                  disabled={fieldsDisabled}
                  onChange={(e) => updateField("note", e.target.value)}
                  className={cn(
                    "border-input bg-transparent placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 flex min-h-[44px] w-full rounded-lg border px-2.5 py-1.5 text-sm transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"
                  )}
                />
                <div className="flex justify-end text-xs text-muted-foreground">
                  {form.note.length}/{MAX_NOTE_LENGTH}
                </div>
              </FieldContent>
            </Field>

            {isEdit ? (
              <Collapsible
                open={archiveOpen}
                onOpenChange={setArchiveOpen}
                className="rounded-lg border border-dashed"
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {isArchived ? (
                      <ArchiveRestore className="size-4 text-muted-foreground" />
                    ) : (
                      <Archive className="size-4 text-muted-foreground" />
                    )}
                    <span className="flex-1">
                      {text("Archive", "Архів")}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4 text-muted-foreground transition-transform",
                        archiveOpen && "rotate-180"
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="border-t px-3 py-3 text-sm">
                  {isArchived ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {text("Archived", "Заархівовано")}
                          {account?.archived_at
                            ? ` · ${formatArchivedDate(account.archived_at, language)}`
                            : ""}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {text(
                          "Restoring makes the account active again. The balance will resume tracking from its current value.",
                          "Відновлення робить рахунок знову активним. Баланс продовжить відстежуватися від поточного значення."
                        )}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          onClick={handleRestore}
                          disabled={restorePending || deletePending}
                        >
                          {restorePending ? <Loader className="animate-spin" /> : <ArchiveRestore />}
                          {text("Restore", "Відновити")}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => setConfirmDelete(true)}
                          disabled={restorePending || deletePending}
                        >
                          <Trash2 />
                          {text("Delete permanently", "Видалити назавжди")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-muted-foreground">
                        {text(
                          "The account will be hidden from default lists and reports. Transactions remain intact.",
                          "Рахунок зникне зі списків і звітів. Транзакції лишаться."
                        )}
                      </p>
                      <div>
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto px-0 text-muted-foreground"
                          onClick={() => setConfirmArchive(true)}
                          disabled={archivePending}
                        >
                          <Archive />
                          {text("Archive account", "Архівувати рахунок")}
                        </Button>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            ) : null}

            {submitError ? (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                <span className="min-w-0 flex-1 break-words">{submitError}</span>
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="border-t bg-muted/50 p-4">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={submitting || archivePending || restorePending}
          >
            {isEdit ? text("Close", "Закрити") : text("Cancel", "Скасувати")}
          </Button>
          <Button type="button" onClick={onSubmit} disabled={!canSubmit}>
            {submitting ? <Loader className="animate-spin" /> : isEdit ? <Pencil /> : <Wallet />}
            {isEdit ? text("Save", "Зберегти") : text("Add account", "Додати рахунок")}
          </Button>
        </DialogFooter>
      </DialogContent>

      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title={text("Discard changes?", "Скасувати зміни?")}
        description={text(
          "You have unsaved changes. They will be lost if you close this dialog.",
          "Є незбережені зміни. Вони будуть втрачені, якщо закрити це вікно."
        )}
        confirmLabel={text("Discard", "Скасувати")}
        onConfirm={() => {
          setConfirmDiscard(false);
          setSubmitError(null);
          resetForm(
            isEdit
              ? buildInitialState(account, currency)
              : buildInitialState(undefined, currency)
          );
          setOpen(false);
        }}
      />

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={(open) => {
          if (!archivePending) setConfirmArchive(open);
        }}
        title={text("Archive account?", "Архівувати рахунок?")}
        description={text(
          `Account "${account?.name ?? ""}" will be hidden from default lists and reports. Transactions will remain intact.`,
          `Рахунок «${account?.name ?? ""}» зникне зі списків і звітів. Транзакції лишаться.`
        )}
        confirmLabel={
          archivePending
            ? text("Archiving…", "Архівування…")
            : text("Archive", "Архівувати")
        }
        onConfirm={handleArchive}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!deletePending) setConfirmDelete(open);
        }}
        title={text("Delete account permanently?", "Видалити рахунок назавжди?")}
        description={text(
          `Account "${account?.name ?? ""}" and its full transaction history will be removed. This cannot be undone.`,
          `Рахунок «${account?.name ?? ""}» та вся історія його операцій будуть видалені. Цю дію не можна скасувати.`
        )}
        confirmLabel={
          deletePending
            ? text("Deleting…", "Видалення…")
            : text("Delete permanently", "Видалити назавжди")
        }
        onConfirm={handleDelete}
      />
    </Dialog>
  );
}

function formatArchivedDate(iso: string, language: "en" | "uk"): string {
  try {
    return new Date(iso).toLocaleDateString(language === "uk" ? "uk-UA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
