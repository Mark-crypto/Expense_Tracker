import { Suspense } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Camera, CaretDown, ChartLineUp, Moon, PencilLine, Plus, Receipt, Scan, ShieldCheck, SignOut, SquaresFour, Sun, UploadSimple, User, Wallet } from "@phosphor-icons/react";
import { AddExpenseProvider, useAddExpense } from "@/hooks/useAddExpense";
import { useAuth } from "@/hooks/useAuth";
import { toggleTheme, useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/common";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Loading from "@/components/Loading";
import CommandBar from "@/components/CommandBar";
import NotificationCenter from "@/components/NotificationCenter";
import { initials, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const mainLinks = [
  { to: "/dashboard", label: "Dashboard", icon: SquaresFour },
  { to: "/history", label: "Expenses", icon: Receipt },
  { to: "/budget", label: "Budgets", icon: Wallet },
  { to: "/predictions", label: "Forecast", icon: ChartLineUp },
  { to: "/insights", label: "Money X-ray", icon: Scan },
];

export const Logo = ({ className }) => (
  <span className={cn("flex items-center gap-2.5 font-semibold tracking-tight", className)}>
    <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <Wallet className="size-4" aria-hidden />
    </span>
    Expense Tracker
  </span>
);

const SideLink = ({ to, label, icon: Icon }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )
    }
  >
    <Icon className="size-4" aria-hidden />
    {label}
  </NavLink>
);

const Sidebar = () => {
  const { user, isAdmin, logout } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-card lg:flex">
      <Link to="/dashboard" className="flex h-16 items-center px-5">
        <Logo />
      </Link>

      <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {mainLinks.map((link) => (
          <SideLink key={link.to} {...link} />
        ))}
        <div className="my-3 border-t border-border" />
        <SideLink to={`/new/profile/${user?.id}`} label="Profile" icon={User} />
        {isAdmin && <SideLink to="/admin-dashboard" label="Admin" icon={ShieldCheck} />}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-border p-3">
        <Avatar text={initials(user?.name)} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{titleCase(user?.name)}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Log out" onClick={logout}>
          <SignOut />
        </Button>
      </div>
    </aside>
  );
};

const AddMenu = () => {
  const { openAdd } = useAddExpense();
  const navigate = useNavigate();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button className="ml-1.5 hidden lg:inline-flex">
          <Plus /> Add expense <CaretDown className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={() => openAdd()}>
          <PencilLine /> Add by hand
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openAdd({ scan: true })}>
          <Camera /> Scan receipt
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate("/import")}>
          <UploadSimple /> Import M-Pesa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Topbar = () => {
  const { user } = useAuth();
  const theme = useTheme();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6 lg:h-16 lg:justify-end">
      <Link to="/dashboard" className="lg:hidden">
        <Logo className="text-sm" />
      </Link>
      <div className="flex items-center gap-1.5">
        <CommandBar />
        <Button
          variant="ghost"
          size="icon"
          aria-label={theme === "dark" ? "Use light theme" : "Use dark theme"}
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>
        <NotificationCenter />
        <AddMenu />
        <Link to={`/new/profile/${user?.id}`} aria-label="Profile" className="ml-1 lg:hidden">
          <Avatar text={initials(user?.name)} className="size-8" />
        </Link>
      </div>
    </header>
  );
};

const tabStyles = "flex flex-col items-center gap-1 py-2 text-[11px] font-medium";

const MobileTab = ({ to, label, icon: Icon }) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(tabStyles, isActive ? "text-primary" : "text-muted-foreground")}
  >
    <Icon className="size-5" aria-hidden />
    {label}
  </NavLink>
);

const MobileTabs = () => {
  const { openAdd } = useAddExpense();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <MobileTab {...mainLinks[0]} />
      <MobileTab {...mainLinks[1]} />
      <button type="button" className={cn(tabStyles, "text-muted-foreground")} onClick={() => openAdd()}>
        <Plus className="size-5" aria-hidden />
        Add
      </button>
      <MobileTab {...mainLinks[2]} />
      <MobileTab {...mainLinks[3]} />
    </nav>
  );
};

const AppLayout = () => (
  <AddExpenseProvider>
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-60">
        <Topbar />
        <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 lg:pb-10">
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <MobileTabs />
    </div>
  </AddExpenseProvider>
);

export default AppLayout;
