import { Fragment, useMemo, useState } from "react";
import { getCoreRowModel, getExpandedRowModel, useReactTable } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ArrowLeft, CaretDown, CaretRight, WarningCircle } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryIcon, MerchantTile } from "@/components/ui/category";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge, Notice } from "@/components/ui/common";
import { CategoryPicker } from "@/components/ui/menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { categoryLabel } from "@/lib/categories";
import { formatDate, formatKES } from "@/lib/format";
import { refreshMoneyData } from "@/lib/refresh";

const rowKey = (row) => `${row.receiptNo}-${row.kind}`;
const payments = (count) => `${count} ${count === 1 ? "payment" : "payments"}`;
const expensesLabel = (count) => `${count} ${count === 1 ? "expense" : "expenses"}`;

const NOT_SORTED = "miscellaneous";
const columns = [{ id: "payment" }];

// One row per merchant. Choosing a category once applies to all its payments.
const groupByMerchant = (transactions) => {
  const groups = new Map();
  for (const row of transactions.filter((item) => item.isSpend)) {
    const name = row.counterparty || row.details;
    if (!groups.has(name)) groups.set(name, { id: `merchant-${name}`, name, payments: [] });
    groups.get(name).payments.push({ ...row, id: rowKey(row) });
  }
  return [...groups.values()]
    .map((group) => {
      const open = group.payments.filter((row) => !row.alreadyImported);
      return {
        ...group,
        total: group.payments.reduce((sum, row) => sum + row.withdrawn, 0),
        category: (open[0] ?? group.payments[0]).category,
        needsLook: open.some((row) => row.category === NOT_SORTED),
        selectable: open.length > 0,
      };
    })
    .sort((a, b) => b.needsLook - a.needsLook || b.total - a.total);
};

const SectionRow = ({ title, hint }) => (
  <TableRow className="bg-muted/50 hover:bg-muted/50">
    <TableCell colSpan={4} className="py-2">
      <span className="text-xs font-semibold">{title}</span>
      {hint && <span className="ml-2 text-xs text-muted-foreground">{hint}</span>}
    </TableCell>
  </TableRow>
);

const ImportReview = ({ statement, onBack, onSaved }) => {
  const queryClient = useQueryClient();
  const groups = useMemo(() => groupByMerchant(statement.transactions), [statement]);
  const [categories, setCategories] = useState(() =>
    Object.fromEntries(groups.map((group) => [group.name, group.category]))
  );
  const [expanded, setExpanded] = useState({});
  const [rowSelection, setRowSelection] = useState(() => {
    const selected = {};
    for (const group of groups) {
      if (group.selectable) selected[group.id] = true;
      for (const row of group.payments) if (!row.alreadyImported) selected[row.id] = true;
    }
    return selected;
  });

  const table = useReactTable({
    data: groups,
    columns,
    state: { expanded, rowSelection },
    getRowId: (row) => row.id,
    getSubRows: (row) => row.payments,
    getRowCanExpand: (row) => row.subRows.length > 0,
    enableRowSelection: (row) => (row.depth === 0 ? row.original.selectable : !row.original.alreadyImported),
    onExpandedChange: setExpanded,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const payingRows = groups.flatMap((group) => group.payments);
  const chosen = payingRows.filter((row) => rowSelection[row.id]);
  const chosenTotal = chosen.reduce((sum, row) => sum + row.withdrawn, 0);
  const openCount = payingRows.filter((row) => !row.alreadyImported).length;
  const toSort = groups.filter((group) => group.needsLook);
  const stillToSort = toSort.filter((group) => categories[group.name] === NOT_SORTED).length;

  const save = useMutation({
    mutationFn: async () => {
      const merchantOf = (row) => row.counterparty || row.details;
      const transactions = statement.transactions.map((row) => ({
        ...row,
        category: row.isSpend ? categories[merchantOf(row)] : row.category,
        save: !!rowSelection[rowKey(row)],
      }));
      return (await axiosInstance.post("mpesa/save", { transactions })).data;
    },
    onSuccess: (data) => {
      refreshMoneyData(queryClient);
      onSaved(data.savedCount);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to save. Please try again."),
  });

  if (statement.transactions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Notice tone="warning" icon={WarningCircle}>
          We couldn't find any transactions in this statement. Check it's a full M-Pesa statement, or try another file.
        </Notice>
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft /> Try another file
        </Button>
      </div>
    );
  }

  const rows = table.getRowModel().rows;
  const firstSorted = rows.find((row) => row.depth === 0 && !row.original.needsLook);
  const allSelected = table.getIsAllRowsSelected();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft /> Back
        </Button>
        <p className="text-sm text-muted-foreground tabular-nums">
          {groups.length} {groups.length === 1 ? "merchant" : "merchants"}, {payments(payingRows.length)}
          {toSort.length > 0 && `, ${stillToSort} still to categorise`}
        </p>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Select all"
                  disabled={openCount === 0}
                  checked={allSelected ? true : chosen.length > 0 ? "indeterminate" : false}
                  onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
                />
              </TableHead>
              <TableHead>Paid to</TableHead>
              <TableHead className="hidden w-60 sm:table-cell">Category</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              if (row.depth === 1) {
                const payment = row.original;
                return (
                  <TableRow key={row.id} className="bg-muted/30">
                    <TableCell>
                      <Checkbox
                        aria-label={`Select payment on ${formatDate(payment.occurredAt.replace(" ", "T"))}`}
                        disabled={!row.getCanSelect()}
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                      />
                    </TableCell>
                    <TableCell colSpan={2} className="max-w-0 whitespace-normal sm:pl-10">
                      <p className="flex justify-between gap-3 text-sm tabular-nums">
                        {formatDate(payment.occurredAt.replace(" ", "T"))}
                        <span className="sm:hidden">{formatKES(payment.withdrawn, 2)}</span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground" title={payment.details}>
                        {payment.details}
                      </p>
                      {payment.alreadyImported && <Badge className="mt-1">Already imported</Badge>}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">{formatKES(payment.withdrawn, 2)}</TableCell>
                  </TableRow>
                );
              }

              const group = row.original;
              const category = categories[group.name];
              const Caret = row.getIsExpanded() ? CaretDown : CaretRight;
              const picker = (
                <CategoryPicker
                  value={category}
                  label={`Category for ${group.name}`}
                  onChange={(value) => setCategories((prev) => ({ ...prev, [group.name]: value }))}
                  triggerClassName="inline-flex max-w-full items-center gap-1.5 rounded-md border border-input bg-card px-2 py-1 text-xs font-medium hover:bg-muted disabled:opacity-60"
                >
                  <CategoryIcon category={category} />
                  <span className="truncate">{categoryLabel(category)}</span>
                  <CaretDown className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                </CategoryPicker>
              );

              return (
                <Fragment key={row.id}>
                  {group.needsLook && row.index === 0 && (
                    <SectionRow title="Needs a look" hint="We couldn't work out these categories" />
                  )}
                  {toSort.length > 0 && firstSorted?.id === row.id && <SectionRow title="Everything else" />}
                  <TableRow className="cursor-pointer" onClick={row.getToggleExpandedHandler()}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        aria-label={`Select ${group.name}`}
                        disabled={!row.getCanSelect()}
                        checked={
                          !group.selectable
                            ? false
                            : row.getIsAllSubRowsSelected()
                              ? true
                              : row.getIsSomeSelected()
                                ? "indeterminate"
                                : false
                        }
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                      />
                    </TableCell>
                    <TableCell className="max-w-0 whitespace-normal">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          aria-label={`${row.getIsExpanded() ? "Hide" : "Show"} payments to ${group.name}`}
                          aria-expanded={row.getIsExpanded()}
                          className="text-muted-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            row.toggleExpanded();
                          }}
                        >
                          <Caret className="size-3.5" />
                        </button>
                        <MerchantTile name={group.name} className="hidden sm:flex" />
                        <div className="min-w-0 flex-1">
                          <p className="flex justify-between gap-3 text-sm font-medium">
                            <span className="truncate">{group.name}</span>
                            <span className="shrink-0 tabular-nums sm:hidden">{formatKES(group.total)}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payments(group.payments.length)}
                            {!group.selectable && " · already imported"}
                          </p>
                          <div className="mt-1 sm:hidden" onClick={(e) => e.stopPropagation()}>
                            {picker}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
                      {picker}
                    </TableCell>
                    <TableCell className="hidden text-right font-medium tabular-nums sm:table-cell">
                      {formatKES(group.total)}
                    </TableCell>
                  </TableRow>
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <div className="sticky bottom-16 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-lg lg:bottom-4">
        <p className="text-sm tabular-nums">
          <span className="font-semibold">{expensesLabel(chosen.length)}</span>
          <span className="ml-2 text-muted-foreground">{formatKES(chosenTotal)}</span>
        </p>
        <Button loading={save.isPending} onClick={() => save.mutate()}>
          {save.isPending
            ? "Importing..."
            : chosen.length > 0
              ? `Import ${expensesLabel(chosen.length)}`
              : "Save to X-ray only"}
        </Button>
      </div>
    </div>
  );
};

export default ImportReview;
