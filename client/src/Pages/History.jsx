import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  ArrowDown,
  ArrowUp,
  CaretDown,
  CaretRight,
  Columns,
  Camera,
  DeviceMobile,
  Export,
  FunnelSimple,
  MagnifyingGlass,
  PencilSimpleLine,
  Receipt,
  Rows,
  Sparkle,
  Stack,
  Trash,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryIcon, MerchantTile } from "@/components/ui/category";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState, ErrorState, Pagination } from "@/components/ui/common";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input, Label } from "@/components/ui/field";
import { CategoryPicker } from "@/components/ui/menu";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnimatedAmount from "@/components/dashboard/AnimatedAmount";
import ExpensePanel from "@/components/expenses/ExpensePanel";
import ExpenseTimeline from "@/components/expenses/ExpenseTimeline";
import { EXPENSE_CATEGORIES, categoryLabel } from "@/lib/categories";
import { displayName } from "@/lib/dashboard";
import { formatDate, formatKES, parseItems, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;
const LARGE_EXPENSE = 5000;
const CLEAR_WORD = "CLEAR";

const SOURCES = {
  mpesa: ["M-Pesa", DeviceMobile],
  receipt: ["Receipt", Camera],
  manual: ["Manual", PencilSimpleLine],
};

const VIEWS = [
  { id: "all", label: "All", test: () => true },
  { id: "review", label: "To review", test: (row) => row.needs_review === 1 },
  { id: "mpesa", label: "M-Pesa", test: (row) => row.source === "mpesa" },
  { id: "large", label: `Over ${formatKES(LARGE_EXPENSE)}`, test: (row) => Number(row.amount) >= LARGE_EXPENSE },
  { id: "budget", label: "In a budget", test: (row) => row.budget_id !== null },
];

const AMOUNTS = [1000, 5000, 10000];
const GROUPS = { none: "None", merchantName: "Merchant", categoryName: "Category", monthName: "Month" };

const columns = [
  {
    id: "select",
    enableSorting: false,
    enableHiding: false,
    size: 36,
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all on this page"
        className="opacity-0 transition-opacity group-hover/head:opacity-100 data-[state=checked]:opacity-100 data-[state=indeterminate]:opacity-100"
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row, table }) => (
      <Checkbox
        aria-label={`Select ${row.original.merchantName}`}
        className={cn(
          "opacity-0 transition-opacity group-hover/row:opacity-100 pointer-coarse:opacity-100 focus-visible:opacity-100 data-[state=checked]:opacity-100",
          table.options.meta.selecting && "opacity-100"
        )}
        checked={row.getIsSelected()}
        onClick={(e) => e.stopPropagation()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  },
  {
    id: "merchantName",
    accessorKey: "merchantName",
    header: "Merchant",
    enableHiding: false,
    cell: ({ row }) => {
      const { merchantName, detail, note, date } = row.original;
      return (
        <div className="flex max-w-44 items-center gap-2.5 sm:max-w-72">
          <MerchantTile name={merchantName} className="group-data-[density=compact]/table:size-6 group-data-[density=compact]/table:rounded-md group-data-[density=compact]/table:text-[10px]" />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{merchantName}</p>
            <p className="truncate text-xs text-muted-foreground group-data-[density=compact]/table:hidden">
              {[detail, note].filter(Boolean).join(" · ")}
            </p>
            <p className="text-xs text-muted-foreground sm:hidden">{formatDate(date)}</p>
          </div>
        </div>
      );
    },
  },
  {
    id: "categoryName",
    accessorKey: "categoryName",
    header: "Category",
    meta: { className: "hidden md:table-cell" },
    cell: ({ row, table }) => (
      <CategoryPicker
        label={`Change category for ${row.original.merchantName}`}
        value={row.original.category}
        onChange={(category) => table.options.meta.onCategory(row.original, category)}
        triggerClassName="-ml-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <CategoryIcon category={row.original.category} />
        {row.original.categoryName}
      </CategoryPicker>
    ),
  },
  {
    id: "source",
    accessorKey: "source",
    header: "Source",
    enableSorting: false,
    meta: { className: "hidden lg:table-cell" },
    cell: ({ getValue }) => {
      const [label, Icon] = SOURCES[getValue()] ?? SOURCES.manual;
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className="size-3.5" aria-hidden />
          {label}
        </span>
      );
    },
  },
  {
    id: "date",
    accessorKey: "date",
    header: "Date",
    meta: { className: "hidden sm:table-cell" },
    cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{formatDate(getValue())}</span>,
  },
  {
    id: "monthName",
    accessorKey: "monthName",
    enableHiding: false,
  },
  {
    id: "amount",
    accessorFn: (row) => Number(row.amount),
    header: "Amount",
    aggregationFn: "sum",
    meta: { className: "text-right" },
    cell: ({ row, getValue }) => (
      <div>
        <p className="font-medium text-foreground">{formatKES(getValue())}</p>
        {row.original.needs_review === 1 && (
          <p className="inline-flex items-center gap-1 text-[11px] font-medium text-warning">
            <Sparkle className="size-3" aria-hidden /> Review
          </p>
        )}
      </div>
    ),
  },
];

const globalSearch = (row, _, value) =>
  [row.original.merchantName, row.original.detail, row.original.note, row.original.categoryName]
    .join(" ")
    .toLowerCase()
    .includes(String(value).toLowerCase());

const Metric = ({ label, value }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-[15px] font-semibold tracking-tight tabular-nums">{value}</p>
  </div>
);

const useIsWide = () => {
  const query = "(min-width: 1120px)";
  const [wide, setWide] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setWide(list.matches);
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, []);
  return wide;
};

const History = () => {
  const queryClient = useQueryClient();
  const wide = useIsWide();
  const searchInput = useRef(null);

  const [view, setView] = useState("all");
  const [filters, setFilters] = useState({});
  const [range, setRange] = useState(null);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState([{ id: "date", desc: true }]);
  const [grouping, setGrouping] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({ monthName: false });
  const [compact, setCompact] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [clearText, setClearText] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["expense", "all"],
    queryFn: async () => (await axiosInstance.get("/expenses?_limit=5000&_page=1")).data,
  });
  const { data: budgets } = useQuery({
    queryKey: ["budgets", "names"],
    queryFn: async () => (await axiosInstance.get("/budget/names")).data.data,
  });

  const allRows = useMemo(
    () =>
      (data?.data ?? []).map((row) => ({
        ...row,
        merchantName: displayName(row),
        detail: row.merchant
          ? row.description || parseItems(row.subcategories).map((item) => item.name).join(", ")
          : "",
        categoryName: categoryLabel(row.category),
        monthName: new Date(`${row.date}T00:00`).toLocaleString("en-KE", { month: "long", year: "numeric" }),
      })),
    [data]
  );

  const merchants = useMemo(() => [...new Set(allRows.map((row) => row.merchantName))].sort(), [allRows]);

  // Rows before the date range, which is what the timeline draws.
  const undated = useMemo(() => {
    const test = VIEWS.find(({ id }) => id === view).test;
    return allRows.filter(
      (row) =>
        test(row) &&
        (!filters.category || row.category === filters.category) &&
        (!filters.merchant || row.merchantName === filters.merchant) &&
        (!filters.source || row.source === filters.source) &&
        (!filters.min || Number(row.amount) >= filters.min)
    );
  }, [allRows, view, filters]);

  const rows = useMemo(
    () => (range ? undated.filter((row) => row.date >= range[0] && row.date <= range[1]) : undated),
    [undated, range]
  );

  const refresh = useCallback(() => {
    ["expense", "dashboard-overview", "budgets", "limit-notification", "merchant-history", "forecast", "xray", "quick-add"].forEach(
      (queryKey) => queryClient.invalidateQueries({ queryKey: [queryKey] })
    );
  }, [queryClient]);

  const bulk = useMutation({
    mutationFn: async (body) => await axiosInstance.post("/expenses/bulk", body),
    onSuccess: refresh,
    onError: () => toast.error("That didn't go through. Please try again."),
  });

  const applyMerchant = (merchant, category, count) => {
    const apply = async (closeToast) => {
      closeToast();
      try {
        const { data: result } = await axiosInstance.post("/expenses/apply-merchant", { merchant, category });
        toast.success(`Updated ${result.updated} expenses`);
        refresh();
      } catch {
        toast.error("Could not update those expenses.");
      }
    };
    toast(
      ({ closeToast }) => (
        <div>
          <p className="text-sm">
            Use {categoryLabel(category)} for all {count} expenses here?
          </p>
          <Button size="sm" className="mt-2" onClick={() => apply(closeToast)}>
            Apply to all
          </Button>
        </div>
      ),
      { autoClose: 8000 }
    );
  };

  const changeCategory = (expense, category) => {
    if (category === expense.category) return;
    bulk.mutate(
      { ids: [expense.expense_id], action: "category", category },
      {
        onSuccess: async () => {
          if (!expense.merchant) return;
          const { data: history } = await axiosInstance.get(
            `/expenses/merchant?name=${encodeURIComponent(expense.merchant)}`
          );
          if (history.count > 1) applyMerchant(expense.merchant, category, history.count);
        },
      }
    );
  };

  const table = useReactTable({
    data: rows,
    columns,
    getRowId: (row) => String(row.expense_id),
    state: { sorting, globalFilter: search, grouping, expanded, rowSelection, columnVisibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: globalSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    groupedColumnMode: false,
    paginateExpandedRows: false,
    autoResetPageIndex: false,
    initialState: { pagination: { pageSize: PAGE_SIZE } },
    meta: { onCategory: changeCategory, selecting: Object.keys(rowSelection).length > 0 },
  });

  const filtered = table.getFilteredRowModel().rows.map((row) => row.original);
  const spent = filtered.reduce((sum, row) => sum + Number(row.amount), 0);
  const activeDays = new Set(filtered.map((row) => row.date)).size || 1;
  const largest = filtered.reduce((top, row) => Math.max(top, Number(row.amount)), 0);
  const selectedIds = Object.keys(rowSelection).map(Number);
  const selectedTotal = allRows
    .filter((row) => rowSelection[row.expense_id])
    .reduce((sum, row) => sum + Number(row.amount), 0);

  const ordered = table.getSortedRowModel().flatRows.filter((row) => !row.getIsGrouped());
  const activeIndex = ordered.findIndex((row) => row.original.expense_id === activeId);
  const active = ordered[activeIndex]?.original ?? allRows.find((row) => row.expense_id === activeId);

  const moveActive = useCallback(
    (step) => {
      if (ordered.length === 0) return;
      const next = ordered[Math.max(0, Math.min(ordered.length - 1, activeIndex + step))];
      setActiveId(next.original.expense_id);
      if (!grouping.length) table.setPageIndex(Math.floor(next.index / PAGE_SIZE) || 0);
    },
    [ordered, activeIndex, grouping.length, table]
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setActiveId(null);
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName) || e.target.isContentEditable) return;
      if (e.ctrlKey || e.metaKey) return;
      const key = e.key.toLowerCase();
      if (key === "/") {
        e.preventDefault();
        searchInput.current?.focus();
      }
      if (key === "j") moveActive(1);
      if (key === "k") moveActive(-1);
      if (key === "x" && activeId) {
        setRowSelection((previous) => {
          const next = { ...previous };
          if (next[activeId]) delete next[activeId];
          else next[activeId] = true;
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [moveActive, activeId]);

  useEffect(() => table.setPageIndex(0), [view, filters, range, search, table]);

  const setFilter = (key, value) => setFilters((previous) => ({ ...previous, [key]: value }));
  const clearAllFilters = () => {
    setFilters({});
    setRange(null);
    setSearch("");
    setView("all");
  };

  const confirmDelete = () => {
    const ids = pendingDelete;
    setPendingDelete(null);
    bulk.mutate(
      { ids, action: "delete" },
      {
        onSuccess: () => {
          setRowSelection({});
          if (ids.includes(activeId)) setActiveId(null);
          toast(
            ({ closeToast }) => (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm">
                  {ids.length === 1 ? "Expense deleted" : `${ids.length} expenses deleted`}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    closeToast();
                    bulk.mutate({ ids, action: "restore" });
                  }}
                >
                  Undo
                </Button>
              </div>
            ),
            { autoClose: 6000 }
          );
        },
      }
    );
  };

  const clearHistory = useMutation({
    mutationFn: async () => await axiosInstance.put("/expenses"),
    onSuccess: (response) => {
      toast.success(response.data.message);
      setClearing(false);
      setClearText("");
      setActiveId(null);
      refresh();
    },
    onError: () => toast.error("Something went wrong"),
  });

  const exportQuery = new URLSearchParams(
    Object.entries({
      q: search,
      from: range?.[0],
      to: range?.[1],
      category: filters.category,
      source: filters.source ?? (view === "mpesa" ? "mpesa" : undefined),
      merchant: filters.merchant,
      min: filters.min,
      view: ["review", "large"].includes(view) ? view : view === "budget" ? "budgeted" : undefined,
    }).filter(([, value]) => value)
  ).toString();

  const exportReport = async () => {
    try {
      const response = await axiosInstance.get(`/expenses/report?${exportQuery}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "expense_report.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download the report. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }
  if (error) return <ErrorState onRetry={refetch} />;

  const chips = [
    filters.category && ["category", "Category", categoryLabel(filters.category)],
    filters.merchant && ["merchant", "Merchant", filters.merchant],
    filters.source && ["source", "Source", SOURCES[filters.source][0]],
    filters.min && ["min", "Amount", `Over ${formatKES(filters.min)}`],
  ].filter(Boolean);

  const panelProps = active && {
    expense: active,
    budgets: budgets ?? [],
    onClose: () => setActiveId(null),
    onMove: moveActive,
    onSaved: refresh,
    onApplyMerchant: applyMerchant,
    onDelete: setPendingDelete,
    onConfirm: (expense) => bulk.mutate({ ids: [expense.expense_id], action: "confirm" }),
  };

  const headerGroup = table.getHeaderGroups()[0];
  const hasFilters = chips.length > 0 || range || search || view !== "all";
  const groupValue = grouping[0] ?? "none";

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl">Expenses</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportReport}>
            <Export /> Export
          </Button>
        </div>
      </header>

      <Card className="grid overflow-hidden md:grid-cols-[minmax(13rem,17rem)_minmax(0,1fr)]">
        <div className="grid grid-cols-2 content-center gap-x-4 gap-y-2.5 border-b border-border p-4 md:border-r md:border-b-0">
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground">Total spent</p>
            <AnimatedAmount value={spent} className="block text-[28px] leading-tight font-semibold tracking-tight tabular-nums" />
          </div>
          <Metric label="Per active day" value={formatKES(spent / activeDays)} />
          <Metric label="Largest" value={formatKES(largest)} />
        </div>
        <div className="min-w-0 px-4 py-3">
          <ExpenseTimeline rows={undated} range={range} onRangeChange={setRange} />
        </div>
      </Card>

      <Tabs value={view} onValueChange={setView}>
        <TabsList variant="line" className="h-auto w-full justify-start gap-4 overflow-x-auto border-b border-border p-0">
          {VIEWS.map(({ id, label, test }) => (
            <TabsTrigger key={id} value={id} className="flex-none px-0 pb-2 text-sm">
              {label}
              <span className="ml-1 rounded bg-muted px-1 text-[11px] text-muted-foreground tabular-nums">
                {allRows.filter(test).length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-center gap-1.5">
        <div className="relative w-full sm:w-64">
          <MagnifyingGlass className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            ref={searchInput}
            aria-label="Search expenses"
            placeholder="Search merchant, item or note"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">
              <FunnelSimple /> Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Category</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-72 overflow-y-auto">
                {EXPENSE_CATEGORIES.map(({ value, label }) => (
                  <DropdownMenuItem key={value} onSelect={() => setFilter("category", value)}>
                    <CategoryIcon category={value} />
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Merchant</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-72 overflow-y-auto">
                {merchants.map((merchant) => (
                  <DropdownMenuItem key={merchant} onSelect={() => setFilter("merchant", merchant)}>
                    {merchant}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Source</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {Object.entries(SOURCES).map(([value, [label, Icon]]) => (
                  <DropdownMenuItem key={value} onSelect={() => setFilter("source", value)}>
                    <Icon />
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Amount</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {AMOUNTS.map((amount) => (
                  <DropdownMenuItem key={amount} onSelect={() => setFilter("min", amount)}>
                    Over {formatKES(amount)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>

        {chips.map(([key, field, label]) => (
          <span key={key} className="inline-flex h-7 items-center overflow-hidden rounded-md border border-border bg-card text-xs">
            <span className="px-2 text-muted-foreground">{field}</span>
            <span className="border-l border-border px-2 font-medium">{label}</span>
            <button
              type="button"
              aria-label={`Remove ${field} filter`}
              onClick={() => setFilter(key, undefined)}
              className="h-full border-l border-border px-1.5 text-muted-foreground hover:text-danger"
            >
              <X className="size-3" aria-hidden />
            </button>
          </span>
        ))}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear all
          </Button>
        )}

        <span className="flex-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="hidden md:inline-flex">
              <Stack /> Group{grouping.length > 0 && `: ${GROUPS[groupValue]}`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={groupValue}
              onValueChange={(value) => {
                setGrouping(value === "none" ? [] : [value]);
                setExpanded({});
              }}
            >
              {Object.entries(GROUPS).map(([value, label]) => (
                <DropdownMenuRadioItem key={value} value={value}>
                  {label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="hidden md:inline-flex">
              <Columns /> Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {["categoryName", "source", "date"].map((id) => (
              <DropdownMenuCheckboxItem
                key={id}
                checked={table.getColumn(id).getIsVisible()}
                onCheckedChange={(value) => table.getColumn(id).toggleVisibility(!!value)}
                onSelect={(e) => e.preventDefault()}
              >
                {table.getColumn(id).columnDef.header}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="secondary"
          size="sm"
          className={cn("hidden md:inline-flex", compact && "bg-accent text-accent-foreground")}
          aria-pressed={compact}
          onClick={() => setCompact((value) => !value)}
        >
          <Rows /> Density
        </Button>
      </div>

      <div className={cn("grid items-start gap-3", active && wide && "grid-cols-[minmax(0,1fr)_21rem]")}>
        <Card className="min-w-0 overflow-hidden">
          {allRows.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No expenses yet"
              description="Add your first expense, or import an M-Pesa statement."
              action={
                <Link to="/import" className={buttonVariants()}>
                  <UploadSimple /> Import M-Pesa
                </Link>
              }
            />
          ) : (
            <div data-density={compact ? "compact" : "comfortable"} className="group/table">
              <Table>
                <TableHeader>
                  <TableRow className="group/head">
                    {headerGroup.headers.map((header) => {
                      const sorted = header.column.getIsSorted();
                      const className = header.column.columnDef.meta?.className;
                      return (
                        <TableHead
                          key={header.id}
                          aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
                          className={cn("h-9 text-xs font-medium text-muted-foreground", header.id === "select" && "w-9 pr-0 pl-3", className)}
                        >
                          {header.column.getCanSort() ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="inline-flex items-center gap-1 hover:text-foreground"
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {sorted === "asc" && <ArrowUp className="size-3" aria-hidden />}
                              {sorted === "desc" && <ArrowDown className="size-3" aria-hidden />}
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => {
                    if (row.getIsGrouped()) {
                      const Caret = row.getIsExpanded() ? CaretDown : CaretRight;
                      const value = row.getValue(row.groupingColumnId);
                      return (
                        <TableRow
                          key={row.id}
                          onClick={row.getToggleExpandedHandler()}
                          className="cursor-pointer bg-muted/60 hover:bg-muted"
                        >
                          <TableCell colSpan={row.getVisibleCells().length - 1} className="h-9 pl-3 text-xs font-medium">
                            <span className="inline-flex items-center gap-1.5">
                              <Caret className="size-3" aria-hidden />
                              {value}
                              <span className="rounded bg-card px-1 text-[11px] text-muted-foreground">
                                {row.subRows.length}
                              </span>
                            </span>
                          </TableCell>
                          <TableCell className="h-9 text-right text-xs font-medium">
                            {formatKES(row.getValue("amount"))}
                          </TableCell>
                        </TableRow>
                      );
                    }
                    const isActive = row.original.expense_id === activeId;
                    return (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() ? "selected" : undefined}
                        onClick={(e) => {
                          if (e.ctrlKey || e.metaKey) row.toggleSelected();
                          else setActiveId(row.original.expense_id);
                        }}
                        className={cn(
                          "group/row cursor-pointer",
                          isActive && "bg-accent shadow-[inset_2px_0_0_var(--primary)] hover:bg-accent"
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              "h-12 group-data-[density=compact]/table:h-9",
                              cell.column.id === "select" && "w-9 pr-0 pl-3",
                              cell.column.columnDef.meta?.className
                            )}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                  {rows.length === 0 || filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        Nothing matches. Remove a filter to see more.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          )}

          {allRows.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border">
              <p className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
                {filtered.length === 1 ? "expense" : "expenses"} ·{" "}
                <span className="font-semibold text-foreground">{formatKES(spent)}</span>
              </p>
              {table.getPageCount() > 1 && (
                <div className="[&>div]:border-0">
                  <Pagination
                    page={table.getState().pagination.pageIndex + 1}
                    totalPages={table.getPageCount()}
                    onChange={(page) => table.setPageIndex(page - 1)}
                  />
                </div>
              )}
            </div>
          )}
        </Card>

        {active && wide && (
          <Card className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto">
            <ExpensePanel key={active.expense_id} {...panelProps} />
          </Card>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="hidden gap-3 text-xs text-muted-foreground lg:flex">
          {[["/", "search"], ["J K", "move"], ["X", "select"], ["Esc", "close"]].map(([key, label]) => (
            <span key={key}>
              <kbd className="rounded border border-border px-1 font-sans">{key}</kbd> {label}
            </span>
          ))}
        </p>
        {allRows.length > 0 && !hasFilters && (
          <Button variant="danger-ghost" size="sm" className="ml-auto" onClick={() => setClearing(true)}>
            <Trash /> Clear all history
          </Button>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-20 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-lg bg-hero p-1.5 pl-3 text-sm whitespace-nowrap text-white shadow-2xl lg:bottom-6">
          <span className="mr-1 font-medium tabular-nums">
            {selectedIds.length} selected · {formatKES(selectedTotal)}
          </span>
          <CategoryPicker
            label="Change category for selected"
            onChange={(category) =>
              bulk.mutate(
                { ids: selectedIds, action: "category", category },
                { onSuccess: () => setRowSelection({}) }
              )
            }
            triggerClassName="rounded-md px-2.5 py-1 font-medium hover:bg-white/15"
          >
            Category
          </CategoryPicker>
          <button
            type="button"
            className="rounded-md px-2.5 py-1 font-medium hover:bg-white/15"
            onClick={() => setPendingDelete(selectedIds)}
          >
            Delete
          </button>
          <button
            type="button"
            aria-label="Clear selection"
            className="rounded-md p-1.5 hover:bg-white/15"
            onClick={() => setRowSelection({})}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}

      {active && !wide && (
        <Sheet open onClose={() => setActiveId(null)} title={titleCase(active.merchantName)}>
          <ExpensePanel key={active.expense_id} {...panelProps} inSheet />
        </Sheet>
      )}

      <ConfirmDelete
        open={!!pendingDelete}
        title={pendingDelete?.length > 1 ? `Delete ${pendingDelete.length} expenses?` : "Delete this expense?"}
        description="This removes it from your expenses, budgets and reports."
        confirmLabel="Delete"
        loading={bulk.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />

      <Dialog
        open={clearing}
        onOpenChange={(open) => {
          setClearing(open);
          setClearText("");
        }}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clear all expense history?</DialogTitle>
            <DialogDescription>
              This clears every expense and your imported statement data, and can't be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="clearConfirm">Type {CLEAR_WORD} to confirm</Label>
            <Input id="clearConfirm" value={clearText} onChange={(e) => setClearText(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setClearing(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={clearText !== CLEAR_WORD}
              loading={clearHistory.isPending}
              onClick={() => clearHistory.mutate()}
            >
              Clear all history
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default History;
