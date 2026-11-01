import { ArrowDownLeft, ArrowUpRight, Bank, Receipt } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/common";
import { formatDate, formatKES } from "@/lib/format";

const repayments = (count) => `${count} ${count === 1 ? "repayment" : "repayments"}`;

const MoneyXray = ({ xray }) => {
  const largest = Math.max(...xray.topRecipients.map(({ total }) => total), 1);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-accent p-5 text-accent-foreground">
        <p className="text-sm">
          {formatDate(xray.from)} to {formatDate(xray.to)}
        </p>
        <p className="mt-1 text-xl font-semibold tracking-tight">
          You paid {formatKES(xray.fees.total)} in M-Pesa fees
        </p>
        <p className="mt-1 text-sm">
          Across {xray.fees.count} {xray.fees.count === 1 ? "charge" : "charges"} in{" "}
          {xray.transactionCount} transactions.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Money in" icon={ArrowDownLeft} value={formatKES(xray.moneyIn)} />
        <StatCard label="Money out" icon={ArrowUpRight} value={formatKES(xray.moneyOut)} />
        <StatCard
          label="Fuliza repaid"
          icon={Receipt}
          value={formatKES(xray.fuliza.total)}
          hint={repayments(xray.fuliza.count)}
        />
        <StatCard
          label="Loans repaid"
          icon={Bank}
          value={formatKES(xray.loans.total)}
          hint={repayments(xray.loans.count)}
        />
      </div>

      {xray.topRecipients.length > 0 && (
        <Card>
          <CardHeader title="Where most of it went" description="Your biggest recipients" />
          <CardContent>
            <ul className="space-y-3.5">
              {xray.topRecipients.map(({ name, total, count }) => (
                <li key={name}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate">{name}</span>
                    <span className="shrink-0 font-medium tabular-nums">
                      {formatKES(total)}
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        {count}x
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(total / largest) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MoneyXray;
