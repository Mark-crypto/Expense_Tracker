import { Suspense } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  Clock3,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  ShieldCheck,
  Sun,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toggleTheme, useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/common";
import Loading from "@/components/Loading";
import NotificationCenter from "@/components/NotificationCenter";
import { initials, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const mainLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/history", label: "Expenses", icon: Clock3 },
  { to: "/budget", label: "Budgets", icon: Wallet },
  { to: "/predictions", label: "Forecast", icon: TrendingUp },
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
          <LogOut />
        </Button>
      </div>
    </aside>
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
        <Button
          variant="ghost"
          size="icon"
          aria-label={theme === "dark" ? "Use light theme" : "Use dark theme"}
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>
        <NotificationCenter />
        <Link to="/expense-form" className="ml-1.5 hidden lg:block">
          <Button tabIndex={-1}>
            <Plus /> Add expense
          </Button>
        </Link>
        <Link to={`/new/profile/${user?.id}`} aria-label="Profile" className="ml-1 lg:hidden">
          <Avatar text={initials(user?.name)} className="size-8" />
        </Link>
      </div>
    </header>
  );
};

const MobileTabs = () => {
  const tabs = [mainLinks[0], mainLinks[1], { to: "/expense-form", label: "Add", icon: Plus }, mainLinks[2], mainLinks[3]];

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 py-2 text-[11px] font-medium",
              isActive ? "text-primary" : "text-muted-foreground"
            )
          }
        >
          <Icon className="size-5" aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  );
};

const AppLayout = () => (
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
);

export default AppLayout;
