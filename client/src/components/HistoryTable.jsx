import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronRight, Plus, ReceiptText } from "lucide-react";
import axiosInstance from "@/axiosInstance";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, EmptyState, ErrorState, Pagination } from "@/components/ui/common";
import { categoryLabel } from "@/lib/categories";
import { formatDate, formatKES, parseItems } from "@/lib/format";
import { cn } from "@/lib/utils";
import Loading from "./Loading";

const HistoryTable = () => {
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const { isLoading, error, refetch, data: expenseData } = useQuery({
    queryKey: ["expense", page],
    queryFn: async () => await axiosInstance.get(`/expenses?_limit=10&_page=${page}`),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  const toggleRow = (expenseId) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(expenseId) ? next.delete(expenseId) : next.add(expenseId);
      return next;
    });
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorState onRetry={refetch} />;

  const rows = expenseData?.data?.data ?? [];
  const meta = expenseData?.data?.meta;

  if (rows.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={ReceiptText}
          title="No expenses yet"
          description="Add your first expense, or import an M-Pesa statement."
          action={
            <Link to="/expense-form">
              <Button tabIndex={-1}>
                <Plus /> Add expense
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="w-10 py-2.5 pl-4" />
              <th className="px-3 py-2.5 font-medium">Category</th>
              <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Items</th>
              <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Date</th>
              <th className="px-4 py-2.5 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const expanded = expandedRows.has(item.expense_id);
              const items = parseItems(item.subcategories);
              return (
                <Fragment key={item.expense_id}>
                  <tr
                    className="cursor-pointer border-b border-border transition-colors hover:bg-muted/50"
                    onClick={() => toggleRow(item.expense_id)}
                  >
                    <td className="py-3 pl-4">
                      <ChevronRight
                        className={cn(
                          "size-4 text-muted-foreground transition-transform",
                          expanded && "rotate-90"
                        )}
                        aria-hidden
                      />
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(item.expense_id);
                        }}
                      >
                        <Badge>{categoryLabel(item.category)}</Badge>
                      </button>
                      <p className="mt-1 text-xs text-muted-foreground sm:hidden">
                        {formatDate(item.date_created)}
                      </p>
                    </td>
                    <td className="hidden px-3 py-3 text-muted-foreground sm:table-cell">
                      {items.length}
                    </td>
                    <td className="hidden px-3 py-3 whitespace-nowrap text-muted-foreground sm:table-cell">
                      {formatDate(item.date_created)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium whitespace-nowrap tabular-nums">
                      {formatKES(item.amount)}
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="border-b border-border bg-muted/40">
                      <td />
                      <td colSpan={4} className="px-3 py-2">
                        {items.length === 0 ? (
                          <p className="py-1 text-xs text-muted-foreground">No item breakdown</p>
                        ) : (
                          <ul className="max-w-md divide-y divide-border">
                            {items.map((subcategory, index) => (
                              <li key={index} className="flex justify-between gap-4 py-1.5 text-sm">
                                <span className="truncate">{subcategory.name}</span>
                                <span className="text-muted-foreground tabular-nums">
                                  {formatKES(subcategory.amount)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={meta?.totalPages} onChange={setPage} />
    </Card>
  );
};

export default HistoryTable;
