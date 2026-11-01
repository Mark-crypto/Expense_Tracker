import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, CaretUpDown, MagnifyingGlass } from "@phosphor-icons/react";
import { CategoryIcon, MerchantTile } from "@/components/ui/category";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/common";
import { Input } from "@/components/ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { categoryLabel } from "@/lib/categories";
import { displayName, total } from "@/lib/dashboard";
import { formatDate, formatKES } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 8;

const columns = [
  {
    id: "name",
    header: "Paid for",
    accessorFn: displayName,
    cell: ({ getValue }) => (
      <span className="flex items-center gap-2.5 font-medium">
        <MerchantTile name={getValue()} />
        <span className="line-clamp-2 min-w-0 whitespace-normal">{getValue()}</span>
      </span>
    ),
  },
  {
    id: "category",
    header: "Category",
    accessorFn: (row) => categoryLabel(row.category),
    cell: ({ row, getValue }) => (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <CategoryIcon category={row.original.category} />
        {getValue()}
      </span>
    ),
    meta: { className: "hidden sm:table-cell" },
  },
  {
    id: "date",
    header: "Date",
    accessorKey: "date",
    cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{formatDate(getValue())}</span>,
  },
  {
    id: "amount",
    header: "Amount",
    accessorKey: "amount",
    cell: ({ getValue }) => formatKES(getValue()),
    meta: { className: "text-right font-medium" },
  },
];

const SortIcon = ({ direction }) => {
  const Icon = direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : CaretUpDown;
  return <Icon className="size-3" aria-hidden />;
};

const TransactionsTable = ({ expenses }) => {
  const [sorting, setSorting] = useState([{ id: "date", desc: true }]);
  const [search, setSearch] = useState("");

  const table = useReactTable({
    data: expenses,
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: true,
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  const visible = table.getFilteredRowModel().rows;
  const spent = useMemo(() => total(visible.map((row) => row.original)), [visible]);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 pb-2 sm:p-5 sm:pb-2">
        <div>
          <h2 className="text-sm">Transactions</h2>
          <p className="text-xs text-muted-foreground">
            {visible.length} {visible.length === 1 ? "transaction" : "transactions"}, {formatKES(spent)}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <MagnifyingGlass className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            aria-label="Search transactions"
            placeholder="Search transactions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
                    className={cn("px-4 text-xs sm:px-5", header.column.columnDef.meta?.className)}
                  >
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <SortIcon direction={sorted} />
                    </button>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className={cn("px-4 sm:px-5", cell.column.columnDef.meta?.className)}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {visible.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                Nothing matches. Clear the search or filters to see everything.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {table.getPageCount() > 1 && (
        <Pagination
          page={table.getState().pagination.pageIndex + 1}
          totalPages={table.getPageCount()}
          onChange={(page) => table.setPageIndex(page - 1)}
        />
      )}
    </Card>
  );
};

export default TransactionsTable;
