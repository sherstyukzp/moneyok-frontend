"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowLeftRight,
  BookOpen,
  Check,
  ChevronsUpDown,
  CircleUserRound,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  PiggyBank,
  Plus,
  SlidersHorizontal,
  Settings,
  Tag,
  Tags,
  Landmark,
  ChevronRight,
  Users,
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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useData } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { formatMoney } from "@/lib/format";
import { buildCategoryTree } from "@/lib/categories";
import { toast } from "sonner";
import { AccountDialog } from "@/components/account-dialog";
import { CategoryDialog } from "@/components/category-dialog";
import { TagDialog } from "@/components/tag-dialog";
import { RecipientDialog } from "@/components/recipient-dialog";
import { CategorySwatch } from "@/components/category-looks";
import { CreateBookDialog } from "@/components/create-book-dialog";

const LAST_MAIN_PATH_KEY = "moneyok:last-main-path";
let lastMainPath = "/overview";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSettings = pathname === "/settings";

  React.useEffect(() => {
    if (isSettings) return;
    const query = searchParams.toString();
    lastMainPath = query ? `${pathname}?${query}` : pathname;
    window.sessionStorage.setItem(LAST_MAIN_PATH_KEY, lastMainPath);
  }, [isSettings, pathname, searchParams]);

  return (
    <Sidebar collapsible="icon" {...props}>
      {isSettings ? (
        <>
          <SettingsHeader />
          <SidebarContent>
            <SettingsNav />
          </SidebarContent>
        </>
      ) : (
        <>
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <BookSwitcher />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <MainNav />
          </SidebarContent>
          <SidebarFooter>
            <NavUser />
          </SidebarFooter>
        </>
      )}

      <SidebarRail />
    </Sidebar>
  );
}

function SettingsHeader() {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { text } = useLanguage();

  const handleBack = () => {
    const storedPath = window.sessionStorage.getItem(LAST_MAIN_PATH_KEY);
    const destination =
      storedPath?.startsWith("/") && !storedPath.startsWith("/settings")
        ? storedPath
        : lastMainPath;

    setOpenMobile(false);
    router.push(destination);
  };

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton onClick={handleBack} tooltip={text("Go back", "Повернутися назад")}>
            <ArrowLeft />
            <span>{text("Back", "Назад")}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}

function MainNav() {
  const { text } = useLanguage();

  const navItems = [
    { title: text("Overview", "Огляд"), href: "/overview", icon: LayoutDashboard },
    { title: text("Transactions", "Транзакції"), href: "/transactions", icon: ArrowLeftRight },
    { title: text("Budgets", "Бюджети"), href: "/budgets", icon: PiggyBank },
  ];

  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          {navItems.map((item) => (
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

      <SidebarGroup className="pt-0">
        <TagsSection />
      </SidebarGroup>

      <SidebarGroup className="pt-0">
        <RecipientsSection />
      </SidebarGroup>
    </>
  );
}

function SettingsNav() {
  const searchParams = useSearchParams();
  const { setOpenMobile } = useSidebar();
  const { text } = useLanguage();
  const tab = searchParams.get("tab") ?? "profile";

  const groups = [
    {
      label: text("Personal", "Особисте"),
      items: [
        { title: text("Profile", "Профіль"), tab: "profile", icon: CircleUserRound },
        { title: text("Personalizations", "Персоналізація"), tab: "personalizations", icon: SlidersHorizontal },
      ],
    },
    {
      label: text("Transactions", "Транзакції"),
      items: [
        { title: text("Categories", "Категорії"), tab: "categories", icon: Tags },
        { title: text("Tags", "Теги"), tab: "tags", icon: Tag },
        { title: text("Recipients", "Одержувачі"), tab: "recipients", icon: Users },
      ],
    },
    {
      label: text("Budget book", "Книга обліку"),
      items: [{ title: text("Accounts", "Рахунки"), tab: "accounts", icon: Landmark }],
    },
    {
      label: text("Other", "Інше"),
      items: [{ title: text("Support", "Підтримка"), tab: "support", icon: LifeBuoy }],
    },
  ];

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup className="py-2" key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map(({ title, tab: t, icon: Icon }) => (
              <SidebarMenuItem key={t}>
                <SidebarMenuButton asChild isActive={tab === t} tooltip={title}>
                  <Link href={`/settings?tab=${t}`} onClick={() => setOpenMobile(false)}>
                    <Icon />
                    <span>{title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
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
  const { text } = useLanguage();
  const bookAccounts = accounts.filter((a) => a.budget_book_id === activeBookId);

  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroupLabel asChild>
        <div className="flex items-center gap-0.5 pr-1">
          <CollapsibleTrigger asChild>
            <button className="flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 text-xs font-medium text-sidebar-foreground/70 transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:text-sidebar-foreground">
              <Landmark className="size-4 shrink-0" />
              <span className="truncate">{text("Accounts", "Рахунки")}</span>
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
                  isActive={pathname === "/transactions" && searchParams.get("account") === account.id}
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
              <AccountDialog mode="create" triggerInline />
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
  const { text } = useLanguage();
  const tree = buildCategoryTree(categories, activeBookId);

  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroupLabel asChild>
        <div className="flex items-center gap-0.5 pr-1">
          <CollapsibleTrigger asChild>
            <button className="flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 text-xs font-medium text-sidebar-foreground/70 transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:text-sidebar-foreground">
              <Tags className="size-4 shrink-0" />
              <span className="truncate">{text("Categories", "Категорії")}</span>
              <ChevronRight className="ml-auto size-3.5 shrink-0 text-sidebar-foreground/50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </button>
          </CollapsibleTrigger>
        </div>
      </SidebarGroupLabel>

      <CollapsibleContent>
        <SidebarMenu>
          <SidebarMenuSub>
            {tree.map((group) => (
              <React.Fragment key={group.id}>
                <li className="flex h-6 items-center px-2.5 text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/60">
                  {group.name}
                </li>
                {group.children.length === 0 ? (
                  <li className="flex h-6 items-center px-2.5 text-xs text-sidebar-foreground/40">
                    {text("No subcategories", "Немає підкатегорій")}
                  </li>
                ) : (
                  group.children.map((child) => (
                    <SidebarMenuSubItem key={child.id}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={pathname === "/transactions" && searchParams.get("category") === child.id}
                      >
                        <Link href={`/transactions?category=${child.id}`}>
                          <CategorySwatch icon={child.icon} color={child.color} bare />
                          <span className="min-w-0 flex-1 truncate">{child.name}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))
                )}
              </React.Fragment>
            ))}
            <SidebarMenuSubItem>
              <CategoryDialog
                mode="create-parent"
                trigger={
                  <button className="flex h-7 w-full items-center gap-2 rounded-md px-2 text-xs text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring">
                    <Plus className="size-3.5" />
                    <span>{text("Add folder", "Додати папку")}</span>
                  </button>
                }
              />
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
}

function TagsSection() {
  const { tags, activeBookId } = useData();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { text } = useLanguage();
  const bookTags = tags.filter((t) => t.budget_book_id === activeBookId);

  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroupLabel asChild>
        <div className="flex items-center gap-0.5 pr-1">
          <CollapsibleTrigger asChild>
            <button className="flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 text-xs font-medium text-sidebar-foreground/70 transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:text-sidebar-foreground">
              <Tag className="size-4 shrink-0" />
              <span className="truncate">{text("Tags", "Теги")}</span>
              <ChevronRight className="ml-auto size-3.5 shrink-0 text-sidebar-foreground/50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </button>
          </CollapsibleTrigger>
        </div>
      </SidebarGroupLabel>

      <CollapsibleContent>
        <SidebarMenu>
          <SidebarMenuSub>
            {bookTags.length === 0 ? (
              <li className="flex h-6 items-center px-2.5 text-xs text-sidebar-foreground/40">
                {text("No tags", "Немає тегів")}
              </li>
            ) : (
              bookTags.map((tag) => (
                <SidebarMenuSubItem key={tag.id}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={pathname === "/transactions" && searchParams.get("tag") === tag.id}
                  >
                    <Link href={`/transactions?tag=${tag.id}`}>
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: tag.color ?? "#6b7280" }}
                      />
                      <span className="min-w-0 flex-1 truncate">{tag.name}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))
            )}
            <SidebarMenuSubItem>
              <TagDialog
                mode="create"
                trigger={
                  <button className="flex h-7 w-full items-center gap-2 rounded-md px-2 text-xs text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring">
                    <Plus className="size-3.5" />
                    <span>{text("Add tag", "Додати тег")}</span>
                  </button>
                }
              />
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
}

function RecipientsSection() {
  const { recipients, activeBookId } = useData();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { text } = useLanguage();
  const bookRecipients = recipients.filter((r) => r.budget_book_id === activeBookId);

  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroupLabel asChild>
        <div className="flex items-center gap-0.5 pr-1">
          <CollapsibleTrigger asChild>
            <button className="flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 text-xs font-medium text-sidebar-foreground/70 transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:text-sidebar-foreground">
              <Users className="size-4 shrink-0" />
              <span className="truncate">{text("Recipients", "Одержувачі")}</span>
              <ChevronRight className="ml-auto size-3.5 shrink-0 text-sidebar-foreground/50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </button>
          </CollapsibleTrigger>
        </div>
      </SidebarGroupLabel>

      <CollapsibleContent>
        <SidebarMenu>
          <SidebarMenuSub>
            {bookRecipients.length === 0 ? (
              <li className="flex h-6 items-center px-2.5 text-xs text-sidebar-foreground/40">
                {text("No recipients", "Немає одержувачів")}
              </li>
            ) : (
              bookRecipients.map((recipient) => (
                <SidebarMenuSubItem key={recipient.id}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={pathname === "/transactions" && searchParams.get("recipient") === recipient.id}
                  >
                    <Link href={`/transactions?recipient=${recipient.id}`}>
                      <span className="min-w-0 flex-1 truncate">{recipient.name}</span>
                      {recipient.account?.name ? (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {recipient.account.name}
                        </span>
                      ) : null}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))
            )}
            <SidebarMenuSubItem>
              <RecipientDialog
                trigger={
                  <button className="flex h-7 w-full items-center gap-2 rounded-md px-2 text-xs text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring">
                    <Plus className="size-3.5" />
                    <span>{text("Add recipient", "Додати отримувача")}</span>
                  </button>
                }
              />
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function BookSwitcher() {
  const { books, activeBookId, activeBook, setActiveBook } = useData();
  const { isMobile } = useSidebar();
  const { text } = useLanguage();
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            tooltip={activeBook?.name ?? "MoneyOK"}
          >
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <BookOpen className="size-4" />
            </div>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{activeBook?.name ?? "MoneyOK"}</span>
              <span className="truncate text-xs text-muted-foreground">{text("Budget book", "Книга обліку")}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
          align="start"
          side={isMobile ? "bottom" : "right"}
          sideOffset={4}
        >
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {text("Budget books", "Книги обліку")}
          </DropdownMenuLabel>
          {books.map((book) => {
            const active = book.id === activeBookId;
            return (
              <DropdownMenuItem key={book.id} onClick={() => setActiveBook(book.id)}>
                <BookOpen />
                <span className="min-w-0 flex-1 truncate">{book.name}</span>
                {active ? <Check className="ml-auto" /> : null}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateOpen(true)}>
            <Plus />
            {text("Create budget book", "Створити книгу обліку")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateBookDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

function NavUser() {
  const { profile } = useData();
  const { user, signOut } = useAuth();
  const { isMobile } = useSidebar();
  const { text } = useLanguage();
  const router = useRouter();

  const name = profile?.full_name?.trim() || text("User", "Користувач");
  const email = profile?.email || user?.email || "";
  const initials = initialsFromName(name);
  const avatarUrl =
    typeof user?.user_metadata.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : undefined;

  const handleSignOut = async () => {
    await signOut();
    toast.success(text("Signed out", "Ви вийшли з акаунта"));
    router.replace("/login");
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip={name}
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={avatarUrl} alt="" className="rounded-lg" />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-xs text-muted-foreground">{email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
            side={isMobile ? "bottom" : "top"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={avatarUrl} alt="" className="rounded-lg" />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings />
                  {text("Settings", "Налаштування")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
              <LogOut />
              {text("Sign out", "Вийти")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
