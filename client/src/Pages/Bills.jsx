import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ArrowsClockwise, CalendarCheck, DotsThree, Plus, UploadSimple } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import BillForm from "@/components/bills/BillForm";
import BillsCalendar from "@/components/bills/BillsCalendar";
import { PaidDialog, StopDialog } from "@/components/bills/BillDialogs";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MerchantTile } from "@/components/ui/category";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge, EmptyState, ErrorState, StatCard } from "@/components/ui/common";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/field";
import { SubPage } from "@/components/ui/breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { KINDS, frequencyLabel, kindLabel, reasonLabel } from "@/lib/bills";
import { categoryLabel } from "@/lib/categories";
import { formatDate, formatKES } from "@/lib/format";
import { refreshMoneyData } from "@/lib/refresh";
import { cn } from "@/lib/utils";
import { usePageTour } from "@/lib/usePageTour";

const RECENT_PRICE_DAYS = 90;

const recentChange = (bill, today) => {
  const [latest] = bill.priceChanges;
  if (!latest) return null;
  const age = (new Date(today) - new Date(latest.date)) / 86400000;
  return age <= RECENT_PRICE_DAYS ? latest : null;
};

const money = (bill) => `${bill.varies ? "~" : ""}${formatKES(bill.amount)}`;

const Row = ({ name, title, detail, amount, muted, children }) => (
  <li className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
    <MerchantTile name={name} />
    <div className="min-w-0 flex-1 basis-40">
      <p className="truncate text-sm font-medium">{title ?? name}</p>
      <p className="truncate text-xs text-muted-foreground">{detail}</p>
    </div>
    {amount && <span className={cn("text-sm font-medium tabular-nums", muted && "text-muted-foreground")}>{amount}</span>}
    {children}
  </li>
);

// A bill added on its due date, waiting for a yes or no. If it was paid under another name,
// picking that payment marks it paid and teaches the bill the name.
const CaptureRow = ({ capture, onConfirm, onReject, onLink, busy }) => {
  const [amount, setAmount] = useState(capture.amount);
  const [picking, setPicking] = useState(false);
  return (
    <Row
      name={capture.name}
      detail={`Added ${formatDate(capture.date)}${capture.varies ? ", estimated" : ""}`}
      amount={capture.varies ? null : formatKES(capture.amount)}
    >
      {capture.varies && (
        <Input
          type="number"
          inputMode="decimal"
          aria-label={`Actual amount for ${capture.name}`}
          className="h-8 w-28 tabular-nums"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      )}
      <div className="flex gap-1.5">
        <Button
          size="sm"
          disabled={busy || Number(amount) <= 0}
          onClick={() => onConfirm({ id: capture.expense_id, amount: capture.varies ? Number(amount) : null })}
        >
          Confirm
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => onReject(capture.expense_id)}>
          Didn't pay
        </Button>
      </div>
      <button
        type="button"
        aria-expanded={picking}
        className="basis-full text-left text-xs font-medium text-primary hover:underline sm:pl-12"
        onClick={() => setPicking((open) => !open)}
      >
        Paid under another name?
      </button>
      {picking && (
        <div className="basis-full space-y-1.5 rounded-lg bg-muted/60 p-2.5 sm:ml-12">
          {capture.candidates.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No payments within 10 days of {formatDate(capture.date)}. If you paid another way, use Confirm.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">Which of these was {capture.name}? We&apos;ll remember the name for next time.</p>
              <ul className="space-y-1">
                {capture.candidates.map((payment) => (
                  <li key={payment.id}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onLink({ id: capture.expense_id, paymentId: payment.id })}
                      className="flex w-full items-center justify-between gap-3 rounded-md border border-border bg-card px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      <span className="min-w-0 truncate">
                        {payment.name}
                        <span className="ml-1.5 text-xs text-muted-foreground">{formatDate(payment.date)}</span>
                      </span>
                      <span className="shrink-0 tabular-nums">{formatKES(payment.amount)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </Row>
  );
};

const Bills = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { pathname, state: routeState } = useLocation();
  const { id } = useParams();
  // Adding or editing a payment is its own page: /bills/new or /bills/:id/edit.
  const formView = pathname === "/bills/new" || pathname.endsWith("/edit");
  const setEditing = (bill) =>
    bill?.id ? navigate(`/bills/${bill.id}/edit`) : navigate("/bills/new", { state: { bill: bill ?? {} } });
  const [stopping, setStopping] = useState(null);
  const [paying, setPaying] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["bills"],
    queryFn: async () => (await axiosInstance.get("/bills")).data,
  });

  const refresh = () => refreshMoneyData(queryClient);

  const act = useMutation({
    mutationFn: async ({ path, body, method = "post" }) => await axiosInstance[method](path, body),
    onSuccess: ({ data: result }) => {
      toast.success(result.message);
      setStopping(null);
      setPaying(null);
      refresh();
    },
    onError: (err) => toast.error(err.response?.data?.message || "That didn't go through. Please try again."),
  });
  const run = (path, body, method) => act.mutate({ path, body, method });

  const notBill = async (suggestion) => {
    await axiosInstance.post("/forecast/bills/dismiss", { key: suggestion.key });
    refresh();
    toast(
      ({ closeToast }) => (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">Removed from suggestions</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              closeToast();
              await axiosInstance.post("/forecast/bills/restore", { key: suggestion.key });
              refresh();
            }}
          >
            Undo
          </Button>
        </div>
      ),
      { autoClose: 6000 }
    );
  };

  const markPaid = (bill) => {
    if (bill.varies) setPaying(bill);
    else run(`/bills/${bill.id}/paid`, {});
  };
  const fromCalendar = (item) => ({ ...item, id: item.recurringId });

  usePageTour("bills", !!data);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }
  if (error) return <ErrorState message="We couldn't load your payments." onRetry={refetch} />;

  const { summary, suggestions, captures, active, stopped, reminders, today, weekAhead } = data;

  if (formView) {
    const editing = id ? [...active, ...stopped].find((bill) => bill.id === Number(id)) : routeState?.bill ?? {};
    return (
      <SubPage
        crumbs={[
          { label: "Bills & Subscriptions", to: "/bills" },
          { label: id ? `Edit ${editing?.name ?? "payment"}` : "Track a payment" },
        ]}
      >
        <Card className="overflow-hidden p-0">
          {editing ? (
            <BillForm
              bill={editing}
              onDone={() => {
                refresh();
                navigate("/bills");
              }}
            />
          ) : (
            <p className="p-5 text-sm text-muted-foreground">This payment wasn't found.</p>
          )}
        </Card>
      </SubPage>
    );
  }
  const groups = KINDS.map((kind) => ({ ...kind, rows: active.filter((bill) => bill.kind === kind.value) })).filter(
    (group) => group.rows.length > 0
  );
  const dueSoon = active.filter((bill) => bill.next_due <= weekAhead);
  const isEmpty = active.length === 0 && suggestions.length === 0 && stopped.length === 0;
  const share = summary.moneyIn ? Math.round((summary.monthly / summary.moneyIn) * 100) : null;

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl">Bills & Subscriptions</h1>
          <p className="text-xs text-muted-foreground">Payments that come round again. We record them, you still pay them.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label data-tour="bills-reminders" className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={reminders}
              aria-label="Email reminders"
              onCheckedChange={(enabled) => run("/bills/reminders", { enabled: !!enabled }, "patch")}
            />
            Email reminders
          </label>
          <Button data-tour="bills-add" onClick={() => setEditing({})}>
            <Plus /> Add payment
          </Button>
        </div>
      </header>

      {isEmpty ? (
        <Card>
          <EmptyState
            icon={CalendarCheck}
            title="Nothing to track yet"
            description="Add KPLC, rent, Spotify or a chama yourself, or import a statement and we'll look for repeat payments."
            action={
              <Link to="/import" className={buttonVariants({ variant: "secondary" })}>
                <UploadSimple /> Import M-Pesa
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Summary">
            <StatCard
              label="Bills each month"
              value={formatKES(summary.bills)}
              hint={`${active.filter((bill) => bill.kind === "bill").length} tracked`}
            />
            <StatCard
              label="Subscriptions each month"
              value={formatKES(summary.subscriptions)}
              hint={`${formatKES(summary.subscriptionsYearly)} a year`}
            />
            {summary.moneyIn === null ? (
              <StatCard
                label="Left after commitments"
                value="Not available yet"
                valueClassName="text-base leading-8 sm:text-base"
                hint={<Link to="/import" className="font-medium text-primary hover:underline">Import a statement</Link>}
              />
            ) : (
              <StatCard
                label="Left after commitments"
                value={formatKES(summary.moneyIn - summary.monthly)}
                hint={`${share}% of about ${formatKES(summary.moneyIn)} is committed`}
              />
            )}
            <StatCard
              label="Next payment"
              value={summary.next ? money(summary.next) : "None"}
              hint={summary.next ? `${summary.next.name}, ${formatDate(summary.next.next_due)}` : "Nothing tracked"}
            />
          </section>

          {captures.length > 0 && (
            <Card>
              <CardHeader title="Please confirm" description="We added these on their due date. Did you pay them?" />
              <CardContent className="pt-2">
                <ul className="divide-y divide-border">
                  {captures.map((capture) => (
                    <CaptureRow
                      key={capture.expense_id}
                      capture={capture}
                      busy={act.isPending}
                      onConfirm={({ id, amount }) => run(`/bills/captures/${id}/confirm`, { amount })}
                      onReject={(id) => run(`/bills/captures/${id}/reject`)}
                      onLink={({ id, paymentId }) => run(`/bills/captures/${id}/link`, { paymentId })}
                    />
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className={cn("grid gap-3", active.length > 0 && "xl:grid-cols-[minmax(0,1fr)_24rem]")}>
            {active.length > 0 && (
              <div className="min-w-0 xl:sticky xl:top-20 xl:col-start-2 xl:row-start-1 xl:self-start">
                <BillsCalendar
                  busy={act.isPending}
                  onPaid={(item) => markPaid(fromCalendar(item))}
                  onSkip={(item) => run(`/bills/${item.recurringId}/skip`)}
                />
              </div>
            )}

            <div className="min-w-0 space-y-3 xl:col-start-1 xl:row-start-1">
          {dueSoon.length > 0 && (
            <Card>
              <CardHeader title="Due this week" description="Paid already? Mark it so it isn't added again." />
              <CardContent className="pt-2">
                <ul className="divide-y divide-border">
                  {dueSoon.map((bill) => (
                    <Row key={bill.id} name={bill.name} detail={`Due ${formatDate(bill.next_due)}`} amount={money(bill)}>
                      <div className="flex gap-1.5">
                        <Button size="sm" disabled={act.isPending} onClick={() => markPaid(bill)}>
                          Mark paid
                        </Button>
                        <Button size="sm" variant="ghost" disabled={act.isPending} onClick={() => run(`/bills/${bill.id}/skip`)}>
                          Skip
                        </Button>
                      </div>
                    </Row>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {suggestions.length > 0 && (
            <Card data-tour="bills-suggested">
              <CardHeader title="Suggested" description="These look like repeat payments. Nothing is tracked until you say so." />
              <CardContent className="pt-2">
                <ul className="divide-y divide-border">
                  {suggestions.map((suggestion) => (
                    <Row
                      key={suggestion.key}
                      name={suggestion.name}
                      detail={`${kindLabel(suggestion.kind)}, ${frequencyLabel(suggestion.frequency).toLowerCase()}, ${suggestion.payments} payments found`}
                      amount={money(suggestion)}
                    >
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={() => setEditing(suggestion)}>
                          Track
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => notBill(suggestion)}>
                          Not recurring
                        </Button>
                      </div>
                    </Row>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {groups.map((group) => (
            <Card key={group.value}>
              <CardHeader title={group.plural} description="Added automatically on each due date." />
              <CardContent className="pt-2">
                <ul className="divide-y divide-border">
                  {group.rows.map((bill) => {
                    const change = recentChange(bill, today);
                    return (
                    <Row
                      key={bill.id}
                      name={bill.name}
                      detail={`${frequencyLabel(bill.frequency)}, ${categoryLabel(bill.category)}, next ${formatDate(bill.next_due)}`}
                    >
                      {change && (
                        <Badge className="ml-auto">
                          {change.to > change.from ? "Up" : "Down"} {formatKES(Math.abs(change.to - change.from))}
                        </Badge>
                      )}
                      {bill.varies && <Badge className="ml-auto">Estimated</Badge>}
                      <div className="ml-auto text-right">
                        <p className="text-sm font-medium tabular-nums">{money(bill)}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">{formatKES(bill.yearly)} a year</p>
                      </div>
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8" aria-label={`Actions for ${bill.name}`}>
                            <DotsThree weight="bold" className="text-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setEditing(bill)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => markPaid(bill)}>Mark paid</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => run(`/bills/${bill.id}/skip`)}>Skip next payment</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setStopping(bill)}>Stop tracking</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </Row>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ))}

          {stopped.length > 0 && (
            <Card>
              <CardHeader title="Stopped" description="No longer added. Past expenses are kept." />
              <CardContent className="pt-2">
                <ul className="divide-y divide-border">
                  {stopped.map((bill) => (
                    <Row
                      key={bill.id}
                      name={bill.name}
                      detail={[`Stopped ${formatDate(bill.stopped_at)}`, reasonLabel(bill.stop_reason), bill.stop_note]
                        .filter(Boolean)
                        .join(", ")}
                      amount={money(bill)}
                      muted
                    >
                      <Button size="sm" variant="secondary" disabled={act.isPending} onClick={() => run(`/bills/${bill.id}/restart`)}>
                        <ArrowsClockwise /> Restart
                      </Button>
                    </Row>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
            </div>
          </div>
        </>
      )}

      {stopping && (
        <StopDialog
          bill={stopping}
          pending={act.isPending}
          onClose={() => setStopping(null)}
          onStop={(body) => run(`/bills/${stopping.id}/stop`, body)}
        />
      )}
      {paying && (
        <PaidDialog
          bill={paying}
          pending={act.isPending}
          onClose={() => setPaying(null)}
          onPaid={(amount) => run(`/bills/${paying.id}/paid`, { amount })}
        />
      )}
    </div>
  );
};

export default Bills;
