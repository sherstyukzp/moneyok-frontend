"use client";

import * as React from "react";
import {
  CreditCard,
  LifeBuoy,
  Mail,
  MessageCircle,
  Plus,
  ShieldCheck,
  Trash2,
  Bug,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { PageHeading } from "@/components/page-heading";
import { useData } from "@/lib/store";

const CURRENCIES = [
  { value: "UAH", label: "Гривня (₴ UAH)" },
  { value: "USD", label: "Долар США ($ USD)" },
  { value: "EUR", label: "Євро (€ EUR)" },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="Налаштування"
        description="Профіль, валюта, категорії та підтримка"
      />

      <Tabs defaultValue="profile" className="flex w-full flex-col gap-6 lg:flex-row">
        <TabsList className="h-auto w-full shrink-0 flex-col self-start gap-1 lg:w-52">
          <TabsTrigger value="profile" className="w-full justify-start">
            <CreditCard className="size-4" />
            Профіль і валюта
          </TabsTrigger>
          <TabsTrigger value="categories" className="w-full justify-start">
            <ShieldCheck className="size-4" />
            Категорії
          </TabsTrigger>
          <TabsTrigger value="support" className="w-full justify-start">
            <LifeBuoy className="size-4" />
            Підтримка
          </TabsTrigger>
        </TabsList>

        <div className="min-w-0 flex-1">
          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>
          <TabsContent value="categories">
            <CategoriesTab />
          </TabsContent>
          <TabsContent value="support">
            <SupportTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function ProfileTab() {
  const { profile, updateProfile } = useData();

  const [name, setName] = React.useState(profile?.full_name ?? "");
  const [saved, setSaved] = React.useState(false);

  if (!profile) return null;

  const handleSave = async () => {
    await updateProfile({ full_name: name.trim() || profile.full_name || "" });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Профіль</CardTitle>
          <CardDescription>
            Ці дані використовуються в інтерфейсі та підписах.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Імʼя
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input id="email" type="email" value={profile.email} disabled />
              <p className="text-xs text-muted-foreground">
                Email змінюється в системі автентифікації.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave}>Зберегти</Button>
            {saved ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Збережено
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Валюта</CardTitle>
          <CardDescription>
            Використовується для всіх сум у додатку.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="max-w-xs space-y-2">
            <Select
              value={profile.default_currency}
              onValueChange={(v) => void updateProfile({ default_currency: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Зміна валюти застосовується одразу до всіх розділів.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoriesTab() {
  const { categories, activeBookId, transactions, addCategory, deleteCategory } =
    useData();

  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<"expense" | "income">("expense");

  const bookCategories = React.useMemo(
    () => categories.filter((c) => c.budget_book_id === activeBookId),
    [categories, activeBookId]
  );
  const expense = bookCategories.filter((c) => c.kind === "expense");
  const income = bookCategories.filter((c) => c.kind === "income");

  const totalByCategory = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const tx of transactions) {
      if (!tx.category_id) continue;
      counts.set(tx.category_id, (counts.get(tx.category_id) ?? 0) + 1);
    }
    return counts;
  }, [transactions]);

  const handleAdd = () => {
    if (!name.trim()) return;
    addCategory({ name: name.trim(), kind: type });
    setName("");
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Нова категорія</CardTitle>
          <CardDescription>
            Категорії згруповані за типом: витрати та доходи.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Назва категорії"
              className="sm:max-w-56"
            />
            <Select value={type} onValueChange={(v) => setType(v as "expense" | "income")}>
              <SelectTrigger className="sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Витрата</SelectItem>
                <SelectItem value="income">Дохід</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={!name.trim()}>
              <Plus />
              Додати
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <CategoryGroup
          title="Витрати"
          categories={expense}
          totalByCategory={totalByCategory}
          onDelete={deleteCategory}
          badgeVariant="expense"
        />
        <CategoryGroup
          title="Доходи"
          categories={income}
          totalByCategory={totalByCategory}
          onDelete={deleteCategory}
          badgeVariant="income"
        />
      </div>
    </div>
  );
}

function CategoryGroup({
  title,
  categories,
  totalByCategory,
  onDelete,
  badgeVariant,
}: {
  title: string;
  categories: { id: string; name: string }[];
  totalByCategory: Map<string, number>;
  onDelete: (id: string) => void;
  badgeVariant: "expense" | "income";
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Категорій ще немає.
          </p>
        ) : (
          <ul className="flex flex-col">
            {categories.map((c, index) => (
              <React.Fragment key={c.id}>
                {index > 0 ? <Separator /> : null}
                <li className="flex items-center gap-2 py-2">
                  <Badge
                    variant="outline"
                    className={
                      badgeVariant === "expense"
                        ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"
                    }
                  >
                    {badgeVariant === "expense" ? "Витрата" : "Дохід"}
                  </Badge>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {c.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {totalByCategory.get(c.id) ?? 0} операцій
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(c.id)}
                    aria-label={`Видалити категорію ${c.name}`}
                  >
                    <Trash2 />
                  </Button>
                </li>
              </React.Fragment>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function SupportTab() {
  const items = [
    {
      icon: Mail,
      title: "Email",
      value: "support@moneyok.app",
      href: "mailto:support@moneyok.app",
    },
    {
      icon: MessageCircle,
      title: "Telegram",
      value: "@moneyok_support",
      href: "https://t.me/moneyok_support",
    },
    {
      icon: Bug,
      title: "GitHub",
      value: "Повідомити про проблему",
      href: "https://github.com/moneyok/moneyok/issues",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Звʼязок з нами</CardTitle>
        <CardDescription>
          Додаток перебуває на стадії MVP — ваша думка допоможе зробити його кращим.
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
                    <p className="truncate text-sm text-muted-foreground">
                      {item.value}
                    </p>
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