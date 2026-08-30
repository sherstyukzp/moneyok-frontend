"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Briefcase,
  Bug,
  ChevronDown,
  CreditCard,
  Folder,
  Landmark,
  Languages,
  Mail,
  MessageCircle,
  Monitor,
  Moon,
  Pencil,
  PiggyBank,
  Plus,
  Shield,
  Sun,
  Tag,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  Avatar, AvatarFallback, AvatarImage
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { PageHeading } from "@/components/page-heading";
import { AccountDialog } from "@/components/account-dialog";
import { CategoryDialog } from "@/components/category-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RecipientDialog } from "@/components/recipient-dialog";
import { TagDialog } from "@/components/tag-dialog";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { useData } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import {
  DEFAULT_RATES,
  SUPPORTED_CURRENCIES,
  normalizeRates,
  type ExchangeRates,
} from "@/lib/fx";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { buildCategoryTree, countCategoryUsage } from "@/lib/categories";
import {
  getSettingsTabDescription,
  getSettingsTabTitle,
  resolveSettingsTab,
  type SettingsTab,
} from "@/lib/settings-tabs";
import { CategorySwatch } from "@/components/category-looks";
import { AccountSwatch } from "@/components/account-looks";
import type { Account, AccountType, Category, Recipient, Tag as TagRow } from "@/lib/types";

const CURRENCIES = [
  { value: "UAH", label: ["Hryvnia (₴ UAH)", "Гривня (₴ UAH)"] },
  { value: "USD", label: ["US Dollar ($ USD)", "Долар США ($ USD)"] },
  { value: "EUR", label: ["Euro (€ EUR)", "Євро (€ EUR)"] },
];

const ACCOUNT_ICONS: Record<AccountType, React.ComponentType<{ className?: string }>> = {
  payment: Landmark,
  savings: PiggyBank,
  credit_card: CreditCard,
  investment: TrendingUp,
  reserve: Shield,
  liability: AlertCircle,
  business: Briefcase,
  cash: Wallet,
};

const ACCOUNT_TYPE_ORDER: AccountType[] = [
  "payment",
  "savings",
  "credit_card",
  "investment",
  "reserve",
  "liability",
  "business",
  "cash",
];

export function SettingsView() {
  const searchParams = useSearchParams();
  const { text } = useLanguage();

  const tab: SettingsTab = resolveSettingsTab(searchParams.get("tab"));

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title={getSettingsTabTitle(tab, text)}
        description={getSettingsTabDescription(tab, text)}
        actions={
          tab === "accounts" ? (
            <AccountDialog
              mode="create"
              trigger={
                <Button>
                  <Plus />
                  {text("Add account", "Додати рахунок")}
                </Button>
              }
            />
          ) : tab === "categories" ? (
            <div className="flex flex-wrap items-center gap-2">
              <CategoryDialog
                mode="create-child"
                trigger={
                  <Button>
                    <Plus />
                    {text("Subcategory", "Підкатегорія")}
                  </Button>
                }
              />
              <CategoryDialog
                mode="create-parent"
                trigger={
                  <Button variant="outline">
                    <Folder />
                    {text("Folder", "Папка")}
                  </Button>
                }
              />
            </div>
          ) : tab === "tags" ? (
            <TagDialog
              mode="create"
              trigger={
                <Button>
                  <Plus />
                  {text("Add tag", "Додати тег")}
                </Button>
              }
            />
          ) : tab === "recipients" ? (
            <RecipientDialog
              trigger={
                <Button>
                  <Plus />
                  {text("Add recipient", "Додати отримувача")}
                </Button>
              }
            />
          ) : undefined
        }
      />

      <div className="min-w-0 flex-1">
        {tab === "profile" ? <ProfileTab /> : null}
        {tab === "personalizations" ? <PersonalizationsTab /> : null}
        {tab === "categories" ? <CategoriesTab /> : null}
        {tab === "tags" ? <TagsTab /> : null}
        {tab === "recipients" ? <RecipientsTab /> : null}
        {tab === "accounts" ? <AccountsTab /> : null}
        {tab === "support" ? <SupportTab /> : null}
      </div>
    </div>
  );
}

function ProfileTab() {
  const { profile, updateProfile } = useData();
  const { user } = useAuth();
  const { text } = useLanguage();

  const [name, setName] = React.useState(profile?.full_name ?? "");
  const [saved, setSaved] = React.useState(false);

  if (!profile) return null;

  const handleSave = async () => {
    try {
      await updateProfile({ full_name: name.trim() || profile.full_name || "" });
      setSaved(true);
      toast.success(text("Profile saved", "Профіль збережено"));
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : text("Save error", "Помилка збереження")
      );
    }
  };

  const displayName = profile.full_name?.trim() || text("User", "Користувач");
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const avatarUrl =
    typeof user?.user_metadata.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{text("Profile", "Профіль")}</CardTitle>
        <CardDescription>
          {text("This data is used in your account and signatures.", "Ці дані використовуються у вашому акаунті та підписах.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={avatarUrl} alt="" />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {text("Photo syncs with your account.", "Фото синхронізується з вашим обліковим записом.")}
            </p>
          </div>
        </div>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              {text("Name", "Імʼя")}
            </label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input id="email" type="email" value={profile.email} disabled />
            <p className="text-xs text-muted-foreground">
              {text("Email is changed in the auth system.", "Email змінюється в системі автентифікації.")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSave}>{text("Save", "Зберегти")}</Button>
          {saved ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {text("Saved", "Збережено")}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function PersonalizationsTab() {
  const { profile, updateProfile } = useData();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, text } = useLanguage();

  if (!profile) return null;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{text("Currency", "Валюта")}</CardTitle>
          <CardDescription>
            {text("Used for all amounts in the app.", "Використовується для всіх сум у додатку.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Select
            value={profile.default_currency}
            onValueChange={(value) => {
              void updateProfile({ default_currency: value })
                .then(() =>
                  toast.success(text("Currency updated", "Валюту оновлено"))
                )
                .catch((err: unknown) =>
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : text("Save error", "Помилка збереження")
                  )
                );
            }}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {text(currency.label[0], currency.label[1])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {text("Changes apply to all sections immediately.", "Зміна валюти застосовується одразу до всіх розділів.")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{text("Theme", "Тема інтерфейсу")}</CardTitle>
          <CardDescription>
            {text("Choose light, dark, or system theme.", "Оберіть світлу, темну або системну тему.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={theme ?? "system"} onValueChange={setTheme}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light"><Sun /> {text("Light", "Світла")}</SelectItem>
              <SelectItem value="dark"><Moon /> {text("Dark", "Темна")}</SelectItem>
              <SelectItem value="system"><Monitor /> {text("System", "Системна")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{text("Language", "Мова")}</CardTitle>
          <CardDescription>
            {text("Interface language.", "Мова інтерфейсу.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "uk")}>
            <SelectTrigger className="w-full max-w-xs">
              <Languages className="size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="uk">Українська</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <ExchangeRatesCard />
    </div>
  );
}

const ACCOUNT_TYPE_LABELS: Record<AccountType, [string, string]> = {
  payment: ["Payment accounts", "Платіжні рахунки"],
  savings: ["Savings accounts", "Ощадні рахунки"],
  credit_card: ["Credit cards", "Кредитні картки"],
  investment: ["Investments", "Інвестиції"],
  reserve: ["Reserves", "Застереження"],
  liability: ["Liabilities", "Зобов'язання"],
  business: ["Business accounts", "Бізнес-рахунки"],
  cash: ["Cash", "Готівка"],
};

function AccountsTab() {
  const { accounts, transactions, activeBookId, currency } = useData();
  const { text } = useLanguage();

  const bookAccounts = React.useMemo(
    () => accounts.filter((a) => a.budget_book_id === activeBookId),
    [accounts, activeBookId]
  );

  const totalByAccount = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const tx of transactions) {
      if (!tx.account_id) continue;
      counts.set(tx.account_id, (counts.get(tx.account_id) ?? 0) + 1);
    }
    return counts;
  }, [transactions]);

  const { active, archived } = React.useMemo(() => {
    const active: Account[] = [];
    const archived: Account[] = [];
    for (const account of bookAccounts) {
      if (account.archived_at) archived.push(account);
      else active.push(account);
    }
    const sortByName = (a: Account, b: Account) =>
      a.name.localeCompare(b.name);
    active.sort(sortByName);
    archived.sort(sortByName);
    return { active, archived };
  }, [bookAccounts]);

  const grouped = React.useMemo(() => {
    const map = new Map<AccountType, Account[]>();
    for (const t of ACCOUNT_TYPE_ORDER) map.set(t, []);
    for (const account of active) {
      map.get(account.type)?.push(account);
    }
    return map;
  }, [active]);

  const [editTarget, setEditTarget] = React.useState<Account | null>(null);
  const [showArchived, setShowArchived] = React.useState(false);

  const editLabel = text("Edit", "Редагувати");

  if (bookAccounts.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Wallet className="size-5" />
            </div>
            <p className="text-sm font-medium">{text("No accounts yet", "Ще немає рахунків")}</p>
            <p className="text-sm text-muted-foreground">
              {text("Create your first account to start tracking.", "Створіть перший рахунок, щоб почати вести облік.")}
            </p>
            <AccountDialog
              mode="create"
              trigger={
                <Button className="mt-2">
                  <Plus />
                  {text("Create account", "Створити рахунок")}
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {ACCOUNT_TYPE_ORDER.map((type) => {
        const list = grouped.get(type) ?? [];
        if (list.length === 0) return null;
        const Icon = ACCOUNT_ICONS[type];
        const [labelEn, labelUk] = ACCOUNT_TYPE_LABELS[type];
        return (
          <Card key={type}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="size-4 text-muted-foreground" />
                {text(labelEn, labelUk)}
                <span className="text-xs font-normal text-muted-foreground">
                  {list.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col">
                {list.map((account, index) => (
                  <li key={account.id} className="flex flex-col">
                    {index > 0 ? (
                      <Separator className="my-1" />
                    ) : (
                      <Separator className="mb-1" />
                    )}
                    <ContextMenu>
                      <ContextMenuTrigger asChild>
                        <button
                          type="button"
                          onClick={() => setEditTarget(account)}
                          className="flex items-center gap-3 rounded-md py-2 pr-2 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                        >
                          <AccountSwatch
                            icon={account.icon}
                            color={account.color}
                            className="size-9 rounded-lg"
                            iconClassName="size-4"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{account.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {formatMoney(account.current_balance, account.currency || currency)}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {totalByAccount.get(account.id) ?? 0}{" "}
                            {text("transactions", "операцій")}
                          </span>
                        </button>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onSelect={() => setEditTarget(account)}>
                          <Pencil />
                          {editLabel}
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}

      {archived.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              aria-expanded={showArchived}
              className="flex w-full items-center gap-2 text-left text-base"
            >
              <CardTitle className="flex flex-1 items-center gap-2 text-base">
                {text("Archived", "Заархівовані")}
                <span className="text-xs font-normal text-muted-foreground">
                  {archived.length}
                </span>
              </CardTitle>
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground transition-transform",
                  showArchived && "rotate-180"
                )}
              />
            </button>
          </CardHeader>
          {showArchived ? (
            <CardContent>
              <ul className="flex flex-col">
                {archived.map((account, index) => (
                  <li key={account.id} className="flex flex-col">
                    {index > 0 ? (
                      <Separator className="my-1" />
                    ) : (
                      <Separator className="mb-1" />
                    )}
                    <button
                      type="button"
                      onClick={() => setEditTarget(account)}
                      className="flex items-center gap-3 rounded-md py-2 pr-2 text-left opacity-70 transition-colors hover:bg-muted/60 hover:opacity-100 focus-visible:bg-muted/60 focus-visible:outline-none"
                    >
                      <AccountSwatch
                        icon={account.icon}
                        color={account.color}
                        className="size-9 rounded-lg"
                        iconClassName="size-4"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{account.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatMoney(account.current_balance, account.currency || currency)}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {text("archived", "в архіві")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      {editTarget ? (
        <AccountDialog
          key={editTarget.id}
          mode="edit"
          account={editTarget}
          open
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
        />
      ) : null}
    </div>
  );
}

function CategoriesTab() {
  const { categories, activeBookId, transactions, deleteCategory } = useData();
  const { text } = useLanguage();

  const tree = React.useMemo(
    () => buildCategoryTree(categories, activeBookId),
    [categories, activeBookId]
  );
  const totalByCategory = React.useMemo(
    () => countCategoryUsage(transactions),
    [transactions]
  );

  const [editTarget, setEditTarget] = React.useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Category | null>(null);

  if (tree.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Folder className="size-5" />
            </div>
            <p className="text-sm font-medium">{text("No categories yet", "Категорій ще немає")}</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {text(
                "Create a folder to group related subcategories, or start with a single category.",
                "Створіть папку, щоб згрупувати підкатегорії, або почніть з однієї категорії."
              )}
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
              <CategoryDialog
                mode="create-parent"
                trigger={
                  <Button variant="outline">
                    <Folder />
                    {text("Create folder", "Створити папку")}
                  </Button>
                }
              />
              <CategoryDialog
                mode="create-child"
                trigger={
                  <Button>
                    <Plus />
                    {text("Create category", "Створити категорію")}
                  </Button>
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <CategoryGroupCard
        title={text("Categories", "Категорії")}
        groups={tree}
        totalByCategory={totalByCategory}
        onEdit={setEditTarget}
        onDelete={setDeleteTarget}
      />

      {editTarget ? (
        <CategoryDialog
          key={editTarget.id}
          mode="edit"
          category={editTarget}
          open
          onOpenChange={(open) => { if (!open) setEditTarget(null); }}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={text("Delete category?", "Видалити категорію?")}
        description={
          deleteTarget
            ? deleteTarget.parent_id == null
              ? text(
                  `All subcategories and budgets for "${deleteTarget.name}" will be deleted. Transactions will be uncategorized.`,
                  `Разом із категорією «${deleteTarget.name}» буде видалено підкатегорії та повʼязані бюджети. Операції залишаться без категорії.`
                )
              : text(
                  `Category "${deleteTarget.name}" and its budget will be deleted. Transactions will be uncategorized.`,
                  `Категорію «${deleteTarget.name}» та повʼязаний бюджет буде видалено. Операції залишаться без категорії.`
                )
            : null
        }
        onConfirm={() => {
          if (!deleteTarget) return;
          const target = deleteTarget;
          setDeleteTarget(null);
          void deleteCategory(target.id)
            .then(() =>
              toast.success(
                target.parent_id == null
                  ? text("Folder deleted", "Папку видалено")
                  : text("Category deleted", "Категорію видалено")
              )
            )
            .catch((err: unknown) =>
              toast.error(
                err instanceof Error
                  ? err.message
                  : text("Delete error", "Помилка видалення")
              )
            );
        }}
      />
    </div>
  );
}

function CategoryGroupCard({
  title,
  groups,
  totalByCategory,
  onEdit,
  onDelete,
}: {
  title: string;
  groups: ReturnType<typeof buildCategoryTree>;
  totalByCategory: Map<string, number>;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}) {
  const { text } = useLanguage();

  const editLabel = text("Rename", "Перейменувати");
  const deleteLabel = text("Delete", "Видалити");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {text("No categories yet.", "Категорій ще немає.")}
          </p>
        ) : (
          <ul className="flex flex-col">
            {groups.map((group, groupIndex) => {
              const groupUsage = group.children.reduce(
                (sum, child) => sum + (totalByCategory.get(child.id) ?? 0),
                0
              );
              return (
                <li key={group.id} className="flex flex-col">
                  {groupIndex > 0 ? <Separator className="my-1" /> : <Separator className="mb-1" />}
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <div className="flex items-center gap-2 rounded-md py-2 pr-2 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none">
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{group.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {group.children.length} {text("subcategories", "підкатегорій")} · {groupUsage} {text("transactions", "операцій")}
                        </span>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onSelect={() => onEdit(group)}>
                        <Pencil />
                        {editLabel}
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem variant="destructive" onSelect={() => onDelete(group)}>
                        <Trash2 />
                        {deleteLabel}
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                  {group.children.length === 0 ? (
                    <p className="py-1 pl-8 text-xs text-muted-foreground">{text("No subcategories.", "Немає підкатегорій.")}</p>
                  ) : (
                    <ul className="flex flex-col">
                      {group.children.map((child) => (
                        <li key={child.id}>
                          <ContextMenu>
                            <ContextMenuTrigger asChild>
                              <div className="flex items-center gap-3 rounded-md py-1.5 pl-8 pr-2 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none">
                                <CategorySwatch icon={child.icon} color={child.color} />
                                <span className="min-w-0 flex-1 truncate text-sm">{child.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {totalByCategory.get(child.id) ?? 0} {text("transactions", "операцій")}
                                </span>
                              </div>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem onSelect={() => onEdit(child)}>
                                <Pencil />
                                {editLabel}
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem variant="destructive" onSelect={() => onDelete(child)}>
                                <Trash2 />
                                {deleteLabel}
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TagsTab() {
  const { tags, activeBookId, transactions, deleteTag } = useData();
  const { text } = useLanguage();

  const bookTags = React.useMemo(
    () => tags.filter((t) => t.budget_book_id === activeBookId),
    [tags, activeBookId]
  );

  const totalByTag = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const tx of transactions) {
      if (!tx.tag_id) continue;
      counts.set(tx.tag_id, (counts.get(tx.tag_id) ?? 0) + 1);
    }
    return counts;
  }, [transactions]);

  const [editTarget, setEditTarget] = React.useState<TagRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<TagRow | null>(null);

  const editLabel = text("Rename", "Перейменувати");
  const deleteLabel = text("Delete", "Видалити");

  if (bookTags.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Tag className="size-5" />
            </div>
            <p className="text-sm font-medium">{text("No tags yet", "Тегів ще немає")}</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {text(
                "Tags help you group transactions across accounts and categories.",
                "Теги допомагають групувати операції незалежно від рахунку чи категорії."
              )}
            </p>
            <TagDialog
              mode="create"
              trigger={
                <Button className="mt-2">
                  <Plus />
                  {text("Create tag", "Створити тег")}
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{text("Tags", "Теги")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col">
            {bookTags.map((tag, index) => (
                <li key={tag.id} className="flex flex-col">
                  {index > 0 ? (
                    <Separator className="my-1" />
                  ) : (
                    <Separator className="mb-1" />
                  )}
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <div className="flex items-center gap-3 rounded-md py-2 pr-2 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none">
                        <span
                          className="size-3 shrink-0 rounded-full"
                          style={{ backgroundColor: tag.color ?? "#6b7280" }}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {tag.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {totalByTag.get(tag.id) ?? 0}{" "}
                          {text("transactions", "операцій")}
                        </span>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onSelect={() => setEditTarget(tag)}>
                        <Pencil />
                        {editLabel}
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        variant="destructive"
                        onSelect={() => setDeleteTarget(tag)}
                      >
                        <Trash2 />
                        {deleteLabel}
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </li>
              ))}
            </ul>
        </CardContent>
      </Card>

      {editTarget ? (
        <TagDialog
          key={editTarget.id}
          mode="edit"
          tag={editTarget}
          open
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={text("Delete tag?", "Видалити тег?")}
        description={text(
          `Tag "${deleteTarget?.name ?? ""}" will be removed from transactions.`,
          `Тег «${deleteTarget?.name ?? ""}» буде прибрано з операцій.`
        )}
        onConfirm={() => {
          if (!deleteTarget) return;
          const target = deleteTarget;
          setDeleteTarget(null);
          void deleteTag(target.id)
            .then(() => toast.success(text("Tag deleted", "Тег видалено")))
            .catch((err: unknown) =>
              toast.error(
                err instanceof Error
                  ? err.message
                  : text("Delete error", "Помилка видалення")
              )
            );
        }}
      />
    </div>
  );
}

function ExchangeRatesCard() {
  const { profile, updateProfile } = useData();
  const { text } = useLanguage();

  const baseCurrency = profile?.default_currency ?? "USD";
  const storedRates = React.useMemo(
    () => normalizeRates(profile?.exchange_rates),
    [profile?.exchange_rates]
  );
  const mergedRates = React.useMemo<ExchangeRates>(() => {
    const result: ExchangeRates = {};
    for (const from of SUPPORTED_CURRENCIES) {
      result[from] = { ...(DEFAULT_RATES[from] ?? {}), ...(storedRates[from] ?? {}) };
    }
    return result;
  }, [storedRates]);

  const [loadedRates, setLoadedRates] = React.useState<ExchangeRates>(mergedRates);
  const [draft, setDraft] = React.useState<ExchangeRates>(mergedRates);
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  if (loadedRates !== mergedRates) {
    setLoadedRates(mergedRates);
    setDraft(mergedRates);
    setDirty(false);
  }

  const others = SUPPORTED_CURRENCIES.filter((c) => c !== baseCurrency);

  const setRate = (from: string, to: string, value: string) => {
    const parsed = value === "" ? null : Number(value.replace(",", "."));
    setDraft((prev) => {
      const next = { ...prev, [from]: { ...(prev[from] ?? {}) } };
      if (parsed == null || !Number.isFinite(parsed) || parsed <= 0) {
        delete next[from][to];
      } else {
        next[from][to] = parsed;
      }
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ exchange_rates: draft });
      setDirty(false);
      toast.success(text("Exchange rates saved", "Курси збережено"));
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : text("Save error", "Помилка збереження")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDraft(mergedRates);
    setDirty(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {text("Exchange rates", "Курси валют")}
        </CardTitle>
        <CardDescription>
          {text(
            `Used to convert accounts and transactions to ${baseCurrency}.`,
            `Використовуються для переведення сум у ${baseCurrency}.`
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="flex flex-col gap-3">
          {others.map((from) => {
            const to = baseCurrency;
            const rate =
              draft[from]?.[to] ??
              (() => {
                const inverse = draft[to]?.[from];
                return typeof inverse === "number" && inverse > 0 ? 1 / inverse : null;
              })();
            const inversePreview =
              typeof rate === "number" && rate > 0
                ? 1 / rate
                : null;
            return (
              <li
                key={from}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3"
              >
                <div className="flex items-center gap-2">
                  <span className="w-12 text-sm font-medium">{from}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="w-12 text-sm font-medium">{to}</span>
                </div>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={0}
                  value={typeof rate === "number" ? String(rate) : ""}
                  onChange={(e) => setRate(from, to, e.target.value)}
                  placeholder="0"
                  className="tabular-nums"
                />
                <span className="text-xs tabular-nums text-muted-foreground">
                  {inversePreview != null
                    ? `1 ${to} ≈ ${inversePreview.toFixed(4)} ${from}`
                    : "—"}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">
          {text(
            "Empty values fall back to defaults. Leave blank to use the built-in rate.",
            "Порожні значення використовують типові курси. Залиште поле порожнім, щоб використати вбудований курс."
          )}
        </p>
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={!dirty || saving}>
            {saving
              ? text("Saving…", "Збереження…")
              : text("Save rates", "Зберегти курси")}
          </Button>
          {dirty ? (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              {text("Discard changes", "Скасувати")}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function SupportTab() {
  const { text } = useLanguage();

  const items = [
    { icon: Mail, title: "Email", value: "support@moneyok.app", href: "mailto:support@moneyok.app" },
    { icon: MessageCircle, title: "Telegram", value: "@moneyok_support", href: "https://t.me/moneyok_support" },
    { icon: Bug, title: "GitHub", value: text("Report an issue", "Повідомити про проблему"), href: "https://github.com/moneyok/moneyok/issues" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{text("Contact us", "Звʼязок з нами")}</CardTitle>
        <CardDescription>
          {text("The app is in MVP — your feedback helps us improve.", "Додаток перебуває на стадії MVP — ваша думка допоможе зробити його кращим.")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col">
          {items.map((item, index) => (
            <React.Fragment key={item.title}>
              {index > 0 ? <Separator /> : null}
              <li>
                <a
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-muted"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <item.icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="truncate text-sm text-muted-foreground">{item.value}</p>
                  </div>
                </a>
              </li>
            </React.Fragment>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function RecipientsTab() {
  const { recipients, transactions, deleteRecipient } = useData();
  const { text } = useLanguage();
  const [editTarget, setEditTarget] = React.useState<Recipient | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Recipient | null>(null);

  const totalByRecipient = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const tx of transactions) {
      if (!tx.recipient_id) continue;
      counts.set(tx.recipient_id, (counts.get(tx.recipient_id) ?? 0) + 1);
    }
    return counts;
  }, [transactions]);

  const editLabel = text("Rename", "Перейменувати");
  const deleteLabel = text("Delete", "Видалити");

  if (recipients.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Users className="size-5" />
            </div>
            <p className="text-sm font-medium">{text("No recipients yet", "Одержувачів ще немає")}</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {text(
                "Save frequent payees and merchants to fill them in faster when adding transactions.",
                "Збережіть частих отримувачів, щоб швидше заповнювати операції."
              )}
            </p>
            <RecipientDialog
              trigger={
                <Button className="mt-2">
                  <Plus />
                  {text("Create recipient", "Створити отримувача")}
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{text("Recipients", "Одержувачі")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col">
            {recipients.map((r, index) => (
                <li key={r.id} className="flex flex-col">
                  {index > 0 ? (
                    <Separator className="my-1" />
                  ) : (
                    <Separator className="mb-1" />
                  )}
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <div className="flex items-center gap-3 rounded-md py-2 pr-2 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{r.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {[r.account?.name, r.category?.name].filter(Boolean).join(" · ") || r.notes}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {totalByRecipient.get(r.id) ?? 0}{" "}
                          {text("transactions", "операцій")}
                        </span>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onSelect={() => setEditTarget(r)}>
                        <Pencil />
                        {editLabel}
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        variant="destructive"
                        onSelect={() => setDeleteTarget(r)}
                      >
                        <Trash2 />
                        {deleteLabel}
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </li>
              ))}
            </ul>
        </CardContent>
      </Card>

      {editTarget ? (
        <RecipientDialog
          key={editTarget.id}
          recipient={editTarget}
          open
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={text("Delete recipient?", "Видалити одержувача?")}
        description={text("This action cannot be undone.", "Цю дію неможливо скасувати.")}
        onConfirm={() => {
          if (!deleteTarget) return;
          const target = deleteTarget;
          setDeleteTarget(null);
          void deleteRecipient(target.id)
            .then(() => toast.success(text("Recipient deleted", "Одержувача видалено")))
            .catch((err: unknown) =>
              toast.error(
                err instanceof Error
                  ? err.message
                  : text("Delete error", "Помилка видалення")
              )
            );
        }}
      />
    </div>
  );
}
