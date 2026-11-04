import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useAddExpense } from "@/hooks/useAddExpense";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { EXPENSE_CATEGORIES } from "@/lib/categories";

const pages = [
  { label: "Import M-Pesa statement", to: "/import" },
  { label: "Go to Dashboard", to: "/dashboard" },
  { label: "Go to Expenses", to: "/history" },
  { label: "Go to Budgets", to: "/budget" },
  { label: "Go to Forecast", to: "/predictions" },
  { label: "Go to Bills & Subscriptions", to: "/bills" },
  { label: "Go to Accounts", to: "/accounts" },
  { label: "Go to Money X-ray", to: "/insights" },
  { label: "Privacy & security", to: "/security" },
  { label: "Help", to: "/help" },
];

const CommandBar = () => {
  const navigate = useNavigate();
  const { openAdd } = useAddExpense();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (to) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <>
      <Button variant="secondary" className="hidden lg:inline-flex" onClick={() => setOpen(true)}>
        <MagnifyingGlass />
        Search or jump to
        <kbd className="rounded border border-border px-1 font-sans text-[11px] text-muted-foreground">Ctrl K</kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Search or jump to"
        className="lg:hidden"
        onClick={() => setOpen(true)}
      >
        <MagnifyingGlass />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Search or jump to" description="Find a page or category">
        <CommandInput placeholder="Type a page or category" />
        <CommandList>
          <CommandEmpty>No matches</CommandEmpty>
          <CommandGroup heading="Pages">
            <CommandItem
              value="Add expense"
              onSelect={() => {
                setOpen(false);
                openAdd();
              }}
            >
              Add expense
            </CommandItem>
            {pages.map(({ label, to }) => (
              <CommandItem key={to} value={label} onSelect={() => go(to)}>
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Spending by category">
            {EXPENSE_CATEGORIES.map(({ value, label }) => (
              <CommandItem key={value} value={`Show ${label}`} onSelect={() => go(`/dashboard?category=${value}`)}>
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default CommandBar;
