"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ArrowLeftRight,
  BookOpen,
  Check,
  ChevronsUpDown,
  LayoutDashboard,
  PiggyBank,
  Plus,
  Settings,
  Tags,
  Wallet,
  Landmark,
  ChevronRight,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useData } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { AddAccountDialog } from "@/components/account-dialog";
import { AddCategoryDialog } from "@/components/category-dialog";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { title: "Огляд", href: "/overview", icon: LayoutDashboard },
  { title: "Транзакції", href: "/transactions", icon: ArrowLeftRight },
  { title: "Бюджети", href: "/budgets", icon: PiggyBank },
  { title: "Налаштування", href: "/settings", icon: Settings },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/overview">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Wallet className="size-4" />
                </div>
                <span className="text-[15px] font-semibold tracking-tight">
                  MoneyOK
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="pt-0">
          <AccountsSection />
        </SidebarGroup>

        <SidebarGroup className="pt-0">
          <CategoriesSection />
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <BookSwitcher />
        <SignOutButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function NavItem({
  title,
  href,
  icon: Icon,
}: {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const pathname = usePathname();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={pathname.startsWith(href)} tooltip={title}>
        <Link href={href}>
          <Icon />
          <span>{title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function AccountsSection() {
  const { accounts, activeBookId, currency } = useData();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const bookAccounts = accounts.filter((a) => a.budget_book_id === activeBookId);

  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroupLabel asChild>
        <div className="flex items-center gap-0.5 pr-1">
          <CollapsibleTrigger asChild>
            <button className="flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 text-xs font-medium text-sidebar-foreground/70 transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:text-sidebar-foreground">
              <Landmark className="size-4 shrink-0" />
              <span className="truncate">Рахунки</span>
              <ChevronRight className="ml-auto size-3.5 shrink-0 text-sidebar-foreground/50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </button>
          </CollapsibleTrigger>
        </div>
      </SidebarGroupLabel>

      <CollapsibleContent>
        <SidebarMenu>
          <SidebarMenuSub>
            {bookAccounts.map((account) => (
              <SidebarMenuSubItem key={account.id}>
                <SidebarMenuSubButton
                  asChild
                  isActive={
                    pathname === "/transactions" &&
                    searchParams.get("account") === account.id
                  }
                >
                  <Link href={`/transactions?account=${account.id}`}>
                    <span className="min-w-0 flex-1 truncate">{account.name}</span>
                    <span className="ml-auto text-xs font-medium tabular-nums text-muted-foreground">
                      {formatMoney(account.current_balance, currency)}
                    </span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
            <SidebarMenuSubItem>
              <AddAccountDialog triggerInline />
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CategoriesSection() {
  const { categories, activeBookId } = useData();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const bookCategories = categories.filter((c) => c.budget_book_id === activeBookId);

  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroupLabel asChild>
        <div className="flex items-center gap-0.5 pr-1">
          <CollapsibleTrigger asChild>
            <button className="flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 text-xs font-medium text-sidebar-foreground/70 transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:text-sidebar-foreground">
              <Tags className="size-4 shrink-0" />
              <span className="truncate">Категорії</span>
              <ChevronRight className="ml-auto size-3.5 shrink-0 text-sidebar-foreground/50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </button>
          </CollapsibleTrigger>
        </div>
      </SidebarGroupLabel>

      <CollapsibleContent>
        <SidebarMenu>
          <SidebarMenuSub>
            {bookCategories.map((category) => (
              <SidebarMenuSubItem key={category.id}>
                <SidebarMenuSubButton
                  asChild
                  isActive={
                    pathname === "/transactions" &&
                    searchParams.get("category") === category.id
                  }
                >
                  <Link href={`/transactions?category=${category.id}`}>
                    <span className="min-w-0 truncate">{category.name}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
            <SidebarMenuSubItem>
              <AddCategoryDialog triggerInline />
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SignOutButton() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <SidebarMenu className="mt-2">
      <SidebarMenuItem>
        <SidebarMenuButton
          className="text-muted-foreground"
          tooltip="Вийти"
          onClick={handleSignOut}
        >
          <LogOut />
          <span>Вийти</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function BookSwitcher() {
  const { books, activeBookId, activeBook, setActiveBook } = useData();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              variant="outline"
              className="group/book-switcher justify-start gap-2"
            >
              <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <BookOpen className="size-4" />
              </div>
              <div className="grid min-w-0 flex-1 gap-0.5 text-left leading-none group-data-[collapsible=icon]:hidden">
                <span className="text-[11px] text-muted-foreground">
                  Книга бюджетування
                </span>
                <span className="truncate text-sm font-medium">
                  {activeBook?.name ?? "…"}
                </span>
              </div>
              <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>Книги бюджетування</DropdownMenuLabel>
            {books.map((book) => {
              const active = book.id === activeBookId;
              return (
                <DropdownMenuItem key={book.id} onClick={() => setActiveBook(book.id)}>
                  <BookOpen className="size-4" />
                  <span className="min-w-0 truncate">{book.name}</span>
                  {active ? <Check className="ml-auto size-4" /> : null}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <Plus className="size-4" />
              <span>Створити нову книгу</span>
              <span className="ml-auto text-[11px] text-muted-foreground">
                незабаром
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}