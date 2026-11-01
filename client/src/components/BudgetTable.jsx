import { Fragment, useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ChevronRight, Search, Trash2, Wallet } from "lucide-react";
import axiosInstance from "../axiosInstance";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, EmptyState, ErrorState, Pagination } from "@/components/ui/common";
import { Input } from "@/components/ui/field";
import { categoryLabel } from "@/lib/categories";
import { formatKES, parseItems, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import Loading from "./Loading";

const statusTone = { active: "success", exceeded: "danger", expired: "neutral", inactive: "neutral" };

const BudgetTable = () => {
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const queryClient = useQueryClient();

  const { data: budgetData, error, isLoading, refetch } = useQuery({
    queryKey: ["budgets", page],
    queryFn: async () => await axiosInstance.get(`/budget?_page=${page}&_limit=10`),
    staleTime: 5 * 60 * 1000,
  });

  const { data: searchedItems, isFetching: searchLoading } = useQuery({
    queryKey: ["searchBudget", searchTerm],
    queryFn: async () =>
      await axiosInstance.get(`/budgets/search?q=${encodeURIComponent(searchTerm)}`),
    enabled: searchTerm !== "",
  });

  const debouncedSearch = useMemo(() => debounce((value) => setSearchTerm(value.trim()), 300), []);

  useEffect(() => {
    debouncedSearch(query);
    return () => debouncedSearch.cancel();
  }, [query, debouncedSearch]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (id) => await axiosInstance.delete(`budget/${id}`),
    onSuccess: (data) => {
      toast.success(data.data.message);
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setBudgetToDelete(null);
    },
    onError: () => toast.error("Something went wrong."),
  });

  const isSearching = query.trim() !== "";
  const rows = (isSearching ? searchedItems?.data?.data : budgetData?.data?.data) ?? [];

  const toggleRow = (budgetId) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(budgetId) ? next.delete(budgetId) : next.add(budgetId);
      return next;
    });
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <Card>
      <div className="border-b border-border p-3">
        <div className="relative max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            aria-label="Search budgets"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or category"
            className="pl-9"
          />
        </div>
      </div>

      {searchLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={isSearching ? "No budgets match your search" : "No budgets yet"}
          description={isSearching ? undefined : "Create a budget to start tracking a spending limit."}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="w-10 py-2.5 pl-4" />
                <th className="px-3 py-2.5 font-medium">Budget</th>
                <th className="hidden px-3 py-2.5 font-medium md:table-cell">Category</th>
                <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Status</th>
                <th className="px-3 py-2.5 text-right font-medium">Limit</th>
                <th className="w-12 py-2.5 pr-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => {
                const expanded = expandedRows.has(item.budget_id);
                const items = parseItems(item.subcategories);
                return (
                  <Fragment key={item.budget_id}>
                    <tr
                      className="cursor-pointer border-b border-border transition-colors hover:bg-muted/50"
                      onClick={() => toggleRow(item.budget_id)}
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
                          className="text-left font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(item.budget_id);
                          }}
                        >
                          {titleCase(item.name)}
                        </button>
                        <p className="text-xs text-muted-foreground">
                          {items.length} {items.length === 1 ? "item" : "items"}
                        </p>
                      </td>
                      <td className="hidden px-3 py-3 md:table-cell">
                        <Badge>{categoryLabel(item.category)}</Badge>
                      </td>
                      <td className="hidden px-3 py-3 sm:table-cell">
                        <Badge tone={statusTone[item.status] ?? "neutral"}>
                          {titleCase(item.status || "active")}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-right font-medium whitespace-nowrap tabular-nums">
                        {formatKES(item.amount)}
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <Button
                          variant="danger-ghost"
                          size="icon"
                          aria-label={`Delete ${item.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setBudgetToDelete(item);
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="border-b border-border bg-muted/40">
                        <td />
                        <td colSpan={5} className="px-3 py-2">
                          {items.length === 0 ? (
                            <p className="py-1 text-xs text-muted-foreground">No items</p>
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
      )}

      {!isSearching && (
        <Pagination page={page} totalPages={budgetData?.data?.meta?.totalPages} onChange={setPage} />
      )}

      <Dialog open={!!budgetToDelete} onOpenChange={(open) => !open && setBudgetToDelete(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this budget?</DialogTitle>
            <DialogDescription>
              "{titleCase(budgetToDelete?.name)}" ({formatKES(budgetToDelete?.amount)}) will be
              permanently deleted. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setBudgetToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={isPending}
              onClick={() => mutate(budgetToDelete.budget_id)}
            >
              Delete budget
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default BudgetTable;
