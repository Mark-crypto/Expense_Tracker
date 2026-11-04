import { Link } from "react-router-dom";
import { CheckCircle, Warning, WarningOctagon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatKES, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const tones = {
  critical: { icon: WarningOctagon, className: "text-danger", label: "Over budget" },
  warning: { icon: Warning, className: "text-warning", label: "Worth a look" },
  good: { icon: CheckCircle, className: "text-success", label: "On track" },
};

const Alert = ({ tone, title, detail, children }) => {
  const { icon: Icon, className, label } = tones[tone];
  return (
    <li className="space-y-1 border-t border-border py-3 first:border-0 first:pt-0 last:pb-0">
      <p className={cn("flex items-center gap-1.5 text-xs font-semibold", className)}>
        <Icon className="size-3.5" aria-hidden />
        {label}
      </p>
      <p className="text-sm font-semibold">{title}</p>
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      {children && <div className="flex flex-wrap gap-1.5 pt-1">{children}</div>}
    </li>
  );
};

const billTitle = ({ dueCount, toConfirm }) => {
  const due = dueCount > 0 && `${dueCount} ${dueCount === 1 ? "payment" : "payments"} due this week`;
  const confirm = toConfirm > 0 && `${toConfirm} to confirm`;
  return [due, confirm].filter(Boolean).join(", ");
};

const NeedsAttention = ({ budgets, fees, warnings = [], bills, onSelectCategory }) => {
  const over = budgets.filter((budget) => budget.spent > budget.limit);
  const near = budgets.filter(
    (budget) => budget.spent <= budget.limit && budget.spent / budget.limit >= 0.85
  );
  const healthy = budgets.find((budget) => budget.spent / budget.limit < 0.85);

  return (
    <Card>
      <CardHeader title="Needs attention" description="What to act on first" />
      <CardContent>
        <ul>
          {over.slice(0, 2).map((budget) => (
            <Alert
              key={budget.budget_id}
              tone="critical"
              title={`${titleCase(budget.name)} is over by ${formatKES(budget.spent - budget.limit)}`}
              detail={`${Math.round((budget.spent / budget.limit) * 100)}% of the ${formatKES(budget.limit)} limit used.`}
            >
              <Link to={`/budget/${budget.budget_id}`}>
                <Button variant="secondary" size="sm" tabIndex={-1}>
                  Change limit or move money
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={() => onSelectCategory(budget.category)}>
                See spending
              </Button>
            </Alert>
          ))}

          {bills && (bills.dueCount > 0 || bills.toConfirm > 0) && (
            <Alert
              tone="warning"
              title={billTitle(bills)}
              detail={bills.dueCount > 0 ? `${formatKES(bills.dueTotal)} coming up` : "We added these on their due date."}
            >
              <Link to="/bills">
                <Button variant="secondary" size="sm" tabIndex={-1}>
                  See payments
                </Button>
              </Link>
            </Alert>
          )}

          {warnings.slice(0, 2).map((warning) => (
            <Alert
              key={warning.budget_id}
              tone="warning"
              title={`${titleCase(warning.name)} is heading ${formatKES(warning.over)} over`}
              detail="Based on your bills and usual spending."
            >
              <Link to="/predictions">
                <Button variant="secondary" size="sm" tabIndex={-1}>
                  See forecast
                </Button>
              </Link>
            </Alert>
          ))}

          {near.slice(0, 1).map((budget) => (
            <Alert
              key={budget.budget_id}
              tone="warning"
              title={`${titleCase(budget.name)} is almost used up`}
              detail={`${formatKES(budget.limit - budget.spent)} left.`}
            />
          ))}

          {fees && (
            <Alert
              tone="warning"
              title={`${formatKES(fees.current)} in M-Pesa fees`}
              detail={`Up from ${formatKES(fees.previous)} the month before.`}
            >
              <Link to="/insights">
                <Button variant="secondary" size="sm" tabIndex={-1}>
                  Open Money X-ray
                </Button>
              </Link>
            </Alert>
          )}

          {healthy && (
            <Alert
              tone="good"
              title={`${titleCase(healthy.name)} has ${formatKES(healthy.limit - healthy.spent)} left`}
            />
          )}

          {budgets.length === 0 && !fees && (
            <Alert
              tone="good"
              title="Nothing needs you right now"
              detail="Create a budget to get alerts here."
            >
              <Link to="/budget">
                <Button variant="secondary" size="sm" tabIndex={-1}>
                  Create a budget
                </Button>
              </Link>
            </Alert>
          )}
        </ul>
      </CardContent>
    </Card>
  );
};

export default NeedsAttention;
