import { useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ArrowRight, Scan, UploadSimple } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MerchantTile } from "@/components/ui/category";
import { EmptyState, ErrorState } from "@/components/ui/common";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MoneyMap from "@/components/xray/MoneyMap";
import { monthLabel } from "@/lib/dashboard";
import { formatDate, formatKES } from "@/lib/format";
import { fillLabels, groupColor, groupLabel, isExpenseCategory } from "@/lib/xray";
import { cn } from "@/lib/utils";
import { usePageTour } from "@/lib/usePageTour";

const TABBED_MONTHS = 3;
const times = (count, word = "payment") => `${count} ${count === 1 ? word : `${word}s`}`;

const Hero = ({ xray }) => (
  <section className="grid gap-5 rounded-2xl bg-hero p-5 text-white sm:p-6 lg:grid-cols-2 lg:gap-7">
    <div>
      <p className="text-sm text-white/70">From your M-Pesa statements</p>
      <p className="mt-1 text-2xl leading-tight font-semibold tracking-tight tabular-nums sm:text-[34px]">
        <span className="text-hero-line">{formatKES(xray.moneyIn)}</span> came in, {formatKES(xray.moneyOut)} went out
      </p>
      <p className="mt-2 text-sm text-white/85 tabular-nums">
        {xray.kept >= 0
          ? `${formatKES(xray.kept)} left, ${xray.moneyIn > 0 ? Math.round((xray.kept / xray.moneyIn) * 100) : 0}% of what came in`
          : `${formatKES(-xray.kept)} more went out than came in`}
      </p>
    </div>
    <div className="grid content-center gap-2">
      {xray.findings ? (
        xray.findings.map((text) => (
          <p key={text} className="rounded-lg bg-white/8 px-3 py-2 text-sm text-white/92">
            {fillLabels(text)}
          </p>
        ))
      ) : (
        <p className="rounded-lg bg-white/8 px-3 py-2 text-sm text-white/80">
          Findings appear once you've imported two months, so there's something to compare.
        </p>
      )}
    </div>
  </section>
);

const Categories = ({ outs, selected, onSelect }) => {
  const top = outs[0]?.total || 1;
  return (
    <Card>
      <CardHeader title="Category X-ray" description="Biggest first. Select one to look inside." />
      <CardContent className="pt-2">
        <ul className="space-y-0.5">
          {outs.map((group) => (
            <li key={group.key}>
              <button
                type="button"
                aria-pressed={selected === group.key}
                onClick={() => onSelect(group.key)}
                className={cn(
                  "grid w-full grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1 rounded-lg p-2 text-left text-sm transition-colors hover:bg-muted",
                  selected === group.key && "bg-accent hover:bg-accent"
                )}
              >
                <span className="size-2.5 rounded-sm" style={{ background: groupColor(group.key) }} aria-hidden />
                <span className="truncate font-medium">{groupLabel(group.key)}</span>
                <span className="tabular-nums">{formatKES(group.total)}</span>
                <span className="col-start-2 col-end-4 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <span className="block h-full rounded-full" style={{ width: `${(group.total / top) * 100}%`, background: groupColor(group.key) }} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

const Detail = ({ group, xray, periodText }) => {
  const share = Math.round((group.total / Math.max(xray.moneyOut, 1)) * 100);
  const link = `/history?${new URLSearchParams({ category: group.key, from: xray.periodRange.from, to: xray.periodRange.to })}`;
  return (
    <Card>
      <CardHeader title={groupLabel(group.key)} description={`${share}% of money out, ${periodText}`} />
      <CardContent className="space-y-3 pt-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            [formatKES(group.total), "Total"],
            [group.count, "Payments"],
            [formatKES(group.total / group.count), "Average"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-lg bg-muted px-2.5 py-2">
              <p className="text-[13px] font-semibold break-words tabular-nums sm:text-sm">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <ul className="divide-y divide-border">
          {group.merchants.map((merchant) => (
            <li key={merchant.name} className="flex items-center justify-between gap-3 py-2">
              <span className="flex min-w-0 items-center gap-2.5">
                <MerchantTile name={merchant.name} className="size-7 rounded-md text-[11px]" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{merchant.name}</span>
                  <span className="block text-xs text-muted-foreground tabular-nums">
                    {times(merchant.count)}, about {formatKES(merchant.total / merchant.count)}
                  </span>
                </span>
              </span>
              <span className="text-sm tabular-nums">{formatKES(merchant.total)}</span>
            </li>
          ))}
        </ul>
        {isExpenseCategory(group.key) && (
          <Link to={link} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            See these payments in Expenses <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        )}
      </CardContent>
    </Card>
  );
};

const Costs = ({ costs }) => (
  <Card>
    <CardHeader title="Fees and debt repayments" description="What it cost to move money and pay back credit." />
    <CardContent className="pt-2">
      <p className="text-2xl font-semibold tracking-tight tabular-nums">{formatKES(costs.total)}</p>
      <p className="text-xs text-muted-foreground tabular-nums">
        {costs.share}% of money out, not counting moves to your own accounts
      </p>
      <ul className="mt-2 divide-y divide-border text-sm">
        {costs.rows.map((row) => (
          <li key={row.key} className="flex justify-between gap-3 py-2 tabular-nums">
            <span>
              {groupLabel(row.key)}
              {row.count > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">{times(row.count, row.key === "fees" ? "charge" : "repayment")}</span>
              )}
            </span>
            <span>{formatKES(row.total)}</span>
          </li>
        ))}
      </ul>
      {costs.fulizaBorrowed > 0 && (
        <p className="mt-1 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground tabular-nums">
          You borrowed {formatKES(costs.fulizaBorrowed)} on Fuliza in this period. It's counted in money in.
        </p>
      )}
    </CardContent>
  </Card>
);

const Recipients = ({ people, businesses }) => {
  const [tab, setTab] = useState(people.length > 0 ? "people" : "businesses");
  const rows = tab === "people" ? people : businesses;
  return (
    <Card>
      <CardHeader title="People and businesses" description="Sending to family is different from paying Naivas." />
      <CardContent className="space-y-2 pt-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList aria-label="Recipients">
            <TabsTrigger value="people" className="px-3 text-sm">People</TabsTrigger>
            <TabsTrigger value="businesses" className="px-3 text-sm">Businesses</TabsTrigger>
          </TabsList>
        </Tabs>
        {rows.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Nothing here in this period.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row) => (
              <li key={row.name} className="flex items-center justify-between gap-3 py-2">
                <span className="flex min-w-0 items-center gap-2.5">
                  <MerchantTile name={row.name} className="size-7 rounded-md text-[11px]" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{row.name}</span>
                    <span className="block text-xs text-muted-foreground">{times(row.count, "time")}</span>
                  </span>
                </span>
                <span className="text-sm tabular-nums">{formatKES(row.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

const Insights = () => {
  const [period, setPeriod] = useState(null);
  const [picked, setPicked] = useState(null);

  const { data: xray, isLoading, error, refetch } = useQuery({
    queryKey: ["xray", period],
    queryFn: async () => (await axiosInstance.get("/insights/xray", { params: period ? { period } : {} })).data.xray,
    placeholderData: keepPreviousData,
  });

  const importButton = (primary) => (
    <Link to="/import">
      <Button variant={primary ? "primary" : "secondary"} tabIndex={-1}>
        <UploadSimple /> Import M-Pesa
      </Button>
    </Link>
  );

  usePageTour("xray", !!xray);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }
  if (error) return <ErrorState message="We couldn't load your X-ray." onRetry={refetch} />;

  if (!xray) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl sm:text-2xl">Money X-ray</h1>
        <Card>
          <EmptyState
            icon={Scan}
            title="No statements imported yet"
            description="Import an M-Pesa statement to see where your money came from, where it went, and what fees and Fuliza cost you."
            action={importButton(true)}
          />
        </Card>
      </div>
    );
  }

  const spending = xray.outs.filter((group) => group.key !== "moves");
  const selected = xray.outs.find((group) => group.key === picked) ?? spending[0] ?? xray.outs[0];
  const tabs = [...xray.months.slice(-TABBED_MONTHS), "all"];
  const periodText =
    xray.period === "all" ? `${xray.months.length} months` : monthLabel(xray.period, "long");

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl">Money X-ray</h1>
          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            {formatDate(xray.range.from)} to {formatDate(xray.range.to)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {xray.months.length > 1 && (
            <Tabs value={xray.period} onValueChange={(value) => setPeriod(value)}>
              <TabsList aria-label="Period" data-tour="xray-period">
                {tabs.map((value) => (
                  <TabsTrigger key={value} value={value} className="px-3 text-sm">
                    {value === "all" ? "All" : monthLabel(value)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
          {importButton(false)}
        </div>
      </header>

      <Hero xray={xray} />

      <Card data-tour="xray-map">
        <CardHeader title="Money map" description="Where it came from and where it went. Select a category to look inside it." />
        <CardContent className="pt-0">
          <MoneyMap xray={xray} selected={selected?.key} onSelect={setPicked} />
        </CardContent>
      </Card>

      <section className="grid items-start gap-3 lg:grid-cols-2">
        <Categories outs={xray.outs} selected={selected?.key} onSelect={setPicked} />
        {selected && <Detail group={selected} xray={xray} periodText={periodText} />}
      </section>

      <section className="grid items-start gap-3 lg:grid-cols-2">
        <Costs costs={xray.costs} />
        <Recipients key={xray.period} people={xray.people} businesses={xray.businesses} />
      </section>
    </div>
  );
};

export default Insights;
