import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, GearSix, Warning } from "@phosphor-icons/react";
import { MoveDialog, PaySettingsDialog } from "@/components/accounts/AccountDialogs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { accountColor, dayMonth, signedKES } from "@/lib/accounts";
import { formatKES } from "@/lib/format";

const horizonText = ({ salaried, days, until }) =>
  salaried
    ? `For the next ${days} ${days === 1 ? "day" : "days"}, until your salary on ${dayMonth(until)}`
    : `Spread over ${days} days, because your income has no set date`;

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-4 text-white/85">
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

const Hero = ({ safe, onSettings }) => {
  const used = safe.daily > 0 ? Math.min((safe.spentToday / safe.daily) * 100, 100) : safe.spentToday > 0 ? 100 : 0;

  return (
    <section data-tour="safe" className="grid gap-5 rounded-2xl bg-hero p-5 text-white sm:p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-7">
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-white/70">Safe to spend today</p>
          <button
            type="button"
            aria-label="Change Safe to spend settings"
            onClick={onSettings}
            className="rounded-md p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          >
            <GearSix className="size-4" aria-hidden />
          </button>
        </div>
        <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">{formatKES(safe.daily)}</p>
        <p className="mt-2 text-sm text-white/85">{horizonText(safe)}</p>
        {safe.statementDate && (
          <p className="mt-1 text-xs text-white/70">
            An estimate from your statement on {dayMonth(safe.statementDate)}.{" "}
            <Link to="/accounts" className="font-medium text-white underline">
              Add your accounts
            </Link>{" "}
            for your full picture.
          </p>
        )}
        <div className="mt-4">
          <p className="flex justify-between gap-3 text-xs text-white/70 tabular-nums">
            <span>{formatKES(safe.spentToday)} spent today</span>
            <span>{formatKES(safe.leftToday)} left today</span>
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-hero-line" style={{ width: `${used}%` }} />
          </div>
        </div>
      </div>

      <div className="self-center space-y-1.5 text-sm tabular-nums">
        <Row label="Available this morning" value={signedKES(safe.thisMorning)} />
        <Row label={safe.salaried ? "Due before your salary" : `Due in the next ${safe.days} days`} value={`−${formatKES(safe.due)}`} />
        {safe.goals > 0 && <Row label="Kept for savings goals" value={`−${formatKES(safe.goals)}`} />}
        <Row label="Safety buffer" value={`−${formatKES(safe.buffer)}`} />
        <div className="flex justify-between gap-4 border-t border-white/20 pt-2 font-semibold">
          <span>
            {signedKES(safe.pool)} ÷ {safe.days} {safe.days === 1 ? "day" : "days"}
          </span>
          <span>{formatKES(safe.daily)}</span>
        </div>
        <button type="button" onClick={onSettings} className="hidden pt-1 text-xs font-medium text-white/70 hover:text-white lg:block">
          Change pay day or buffer
        </button>
      </div>
    </section>
  );
};

const LowBalance = ({ warning, onMove }) => (
  <Card className="flex flex-wrap items-center justify-between gap-3 border-l-[3px] border-l-warning p-4">
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-warning">
        <Warning className="size-3.5" aria-hidden /> Low balance
      </p>
      <p className="mt-0.5 text-sm">
        {warning.name} is due on {dayMonth(warning.date)} from {warning.accountName}, but {warning.accountName} is{" "}
        {formatKES(warning.short)} short.
      </p>
    </div>
    {warning.fromName && (
      <Button variant="secondary" onClick={onMove}>
        Move from {warning.fromName}
      </Button>
    )}
  </Card>
);

const Afford = ({ safe }) => {
  const [amount, setAmount] = useState("");
  const value = Number(amount) || 0;
  const after = safe.pool - value;

  return (
    <Card>
      <CardHeader title="Can I afford this?" description="Try an amount. Nothing is saved." />
      <CardContent className="pt-3">
        <label className="flex items-baseline gap-2 border-b-2 border-input pb-1 focus-within:border-primary">
          <span className="text-xs text-muted-foreground">KES</span>
          <input
            type="number"
            min="0"
            inputMode="decimal"
            placeholder="0"
            aria-label="Amount to check"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full min-w-0 [appearance:textfield] bg-transparent text-2xl font-semibold tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </label>
        {value > 0 && (
          <p role="status" className="mt-2.5 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground tabular-nums">
            {after <= 0
              ? `That's more than your safe money. You'd be ${formatKES(-after)} short of your payments${safe.goals > 0 ? ", goals" : ""} and buffer.`
              : `Yes. Your daily number would go from ${formatKES(safe.daily)} to ${formatKES(after / safe.days)}.`}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const WhereItIs = ({ accounts }) => (
  <Card>
    <CardHeader
      title="Where it is now"
      description="Across your accounts"
      action={
        <Link to="/accounts" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          Accounts <ArrowRight className="size-3" aria-hidden />
        </Link>
      }
    />
    <CardContent className="pt-2">
      <ul className="divide-y divide-border text-sm tabular-nums">
        {accounts.map((account) => (
          <li key={account.id} className="flex items-center justify-between gap-3 py-2">
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-sm" style={{ background: accountColor(account.type) }} aria-hidden />
              <span className="truncate">{account.name}</span>
            </span>
            <span>{signedKES(account.balance)}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const SafeToSpend = ({ safe, accounts, lowBalance }) => {
  const [dialog, setDialog] = useState(null);

  if (!safe.ready) {
    return (
      <Card data-tour="safe" className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-semibold">See how much is safe to spend today</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Add your accounts, or import an M-Pesa statement for an estimate.</p>
        </div>
        <Link to="/accounts">
          <Button tabIndex={-1}>Set up accounts</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Hero safe={safe} onSettings={() => setDialog("settings")} />
      {lowBalance && <LowBalance warning={lowBalance} onMove={() => setDialog("move")} />}
      <div className={accounts.length > 0 ? "grid items-start gap-3 lg:grid-cols-2" : undefined}>
        <Afford safe={safe} />
        {accounts.length > 0 && <WhereItIs accounts={accounts} />}
      </div>

      {dialog === "settings" && <PaySettingsDialog settings={safe} onClose={() => setDialog(null)} />}
      {dialog === "move" && (
        <MoveDialog
          accounts={accounts}
          preset={{ fromId: lowBalance.fromId, toId: lowBalance.accountId, amount: lowBalance.short }}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
};

export default SafeToSpend;
