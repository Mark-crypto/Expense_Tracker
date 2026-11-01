import { Link } from "react-router-dom";
import { CheckCircle, Scan } from "@phosphor-icons/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatKES } from "@/lib/format";

const ImportDone = ({ xray, savedCount, onAnother }) => (
  <Card className="mx-auto max-w-2xl">
    <CardContent className="space-y-5 py-8 text-center sm:p-8">
      <div>
        <CheckCircle className="mx-auto size-10 text-success" aria-hidden />
        <h2 className="mt-3 text-lg">
          {savedCount === 0
            ? "Your statement is saved"
            : `${savedCount} ${savedCount === 1 ? "expense" : "expenses"} imported`}
        </h2>
        {xray && (
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(xray.from)} to {formatDate(xray.to)}
          </p>
        )}
      </div>

      {xray && (
        <dl className="grid grid-cols-3 divide-x divide-border rounded-lg border border-border py-3">
          {[
            ["Money in", xray.moneyIn],
            ["Money out", xray.moneyOut],
            ["M-Pesa fees", xray.fees.total],
          ].map(([label, value]) => (
            <div key={label} className="px-2">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums sm:text-base">{formatKES(value)}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        <Link to="/insights" className={buttonVariants()}>
          <Scan /> See your X-ray
        </Link>
        <Link to="/history" className={buttonVariants({ variant: "secondary" })}>
          Go to Expenses
        </Link>
        <Button variant="ghost" onClick={onAnother}>
          Import another
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default ImportDone;
