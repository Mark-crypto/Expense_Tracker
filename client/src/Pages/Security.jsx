import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import axiosInstance from "@/axiosInstance";
import DownloadButton from "@/components/DownloadButton";
import PinDialog from "@/components/security/PinDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/common";
import { Confirm } from "@/components/ui/confirm";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, localToday } from "@/lib/format";
import { setBalancesHidden, useBalancesHidden } from "@/lib/privacy";
import { refreshMoneyData } from "@/lib/refresh";
import { cn } from "@/lib/utils";

const Section = ({ title, danger, children }) => (
  <Card className="overflow-hidden p-0">
    <h2 className={cn("px-4 pt-4 pb-1 text-sm font-semibold sm:px-5", danger && "text-danger")}>{title}</h2>
    <ul className="divide-y divide-border">{children}</ul>
  </Card>
);

const Row = ({ title, badge, detail, children }) => (
  <li className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
    <div className="min-w-48 flex-1">
      <p className="flex items-center gap-2 text-sm font-medium">
        {title}
        {badge}
      </p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
    <div className="flex flex-wrap gap-1.5">{children}</div>
  </li>
);

const Switch = ({ id, checked, onChange, label }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={cn(
      "relative h-6 w-11 shrink-0 rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
      checked ? "border-primary bg-primary" : "border-border bg-muted"
    )}
  >
    <span className={cn("absolute top-0.5 size-4.5 rounded-full bg-card shadow transition-[left]", checked ? "left-5.5" : "left-0.5")} />
  </button>
);

const PasswordDialog = ({ onClose }) => {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: async () => (await axiosInstance.post("/security/password", { current, next })).data,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["security"] });
      onClose();
    },
    onError: (failure) => setError(failure.response?.data?.message || "Your password could not be changed."),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change your password</DialogTitle>
          <DialogDescription>Other devices are signed out, and we email you that it changed.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (next !== again) return setError("The new passwords don't match.");
            setError(null);
            save.mutate();
          }}
        >
          <Field label="Current password" htmlFor="currentPassword">
            <Input id="currentPassword" type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </Field>
          <Field label="New password" htmlFor="newPassword" hint="At least 8 characters.">
            <Input id="newPassword" type="password" required minLength={8} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
          </Field>
          <Field label="New password again" htmlFor="newPasswordAgain">
            <Input id="newPasswordAgain" type="password" required autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
          </Field>
          {error && (
            <p role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" loading={save.isPending}>
            Change password
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Imported transactions go; expenses stay unless the second choice is picked.
const StatementDataDialog = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [keepExpenses, setKeepExpenses] = useState(true);
  const remove = useMutation({
    mutationFn: async () => (await axiosInstance.post("/security/delete-statement-data", { keepExpenses })).data,
    onSuccess: (data) => {
      toast.success(data.message);
      refreshMoneyData(queryClient);
      onClose();
    },
    onError: (failure) => {
      if (failure.response?.status !== 423) toast.error(failure.response?.data?.message || "This could not be done.");
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete statement data</DialogTitle>
          <DialogDescription>Removes every M-Pesa transaction you've imported. Money X-ray empties until you import again.</DialogDescription>
        </DialogHeader>
        <fieldset className="space-y-2">
          <legend className="sr-only">What to remove</legend>
          {[
            [true, "Remove transactions, keep my expenses", "Your spending history, budgets and charts stay as they are."],
            [false, "Remove transactions and the expenses they created", "Expenses you added yourself, by SMS or by receipt, stay."],
          ].map(([value, title, description]) => (
            <label
              key={title}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/60",
                keepExpenses === value && "border-primary bg-accent/60"
              )}
            >
              <input type="radio" name="statementData" className="mt-0.5 size-4" checked={keepExpenses === value} onChange={() => setKeepExpenses(value)} />
              <span>
                <span className="block text-sm font-medium">{title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <p className="text-xs text-muted-foreground">This can't be undone. Download your data first if you might want it.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate()}>
            Delete statement data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Security = () => {
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const hidden = useBalancesHidden();
  const [dialog, setDialog] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["security"],
    queryFn: async () => (await axiosInstance.get("/security")).data,
  });

  const act = useMutation({
    mutationFn: async ({ method = "post", path }) => (await axiosInstance[method](path)).data,
    onSuccess: (result, { after }) => {
      setConfirm(null);
      queryClient.invalidateQueries({ queryKey: ["security"] });
      queryClient.invalidateQueries({ queryKey: ["setup"] });
      if (after) return after();
      toast.success(result.message);
    },
    onError: (failure) => {
      if (failure.response?.status === 423) return setConfirm(null);
      toast.error(failure.response?.data?.message || "This could not be done.");
    },
  });

  if (isLoading) return <Skeleton className="mx-auto h-96 max-w-3xl rounded-xl" />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <header>
        <h1 className="text-xl sm:text-2xl">Privacy & security</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">How your money and your data are protected.</p>
      </header>

      <Section title="Protect the app">
        <Row
          title="4-digit PIN"
          badge={data.pinSet && <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">On</span>}
          detail={
            data.pinSet
              ? "Needed for Accounts, downloading or deleting your data, and changing your password"
              : "Keeps your balances private if someone else picks up your phone"
          }
        >
          {data.pinSet ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => setDialog("pin")}>
                Change PIN
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirm("pin")}>
                Turn off
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setDialog("pin")}>
              Set a PIN
            </Button>
          )}
        </Row>
        <Row title="Hide balances" detail="Show KES ••••• instead of amounts on this device">
          <Switch id="hideBalances" label="Hide balances" checked={hidden} onChange={setBalancesHidden} />
        </Row>
      </Section>

      <Section title="Sign-in">
        <Row
          title="Password"
          detail={
            data.passwordChangedAt
              ? `Changed ${formatDate(data.passwordChangedAt)}. We email you whenever it changes.`
              : "We email you whenever it changes."
          }
        >
          <Button variant="secondary" size="sm" onClick={() => setDialog("password")}>
            Change
          </Button>
        </Row>
        <Row
          title={data.devices === 1 ? "Signed in on 1 device" : `Signed in on ${data.devices} devices`}
          detail="If you've lost a phone or used a shared computer"
        >
          <Button variant="secondary" size="sm" disabled={data.devices <= 1} loading={act.isPending && !confirm} onClick={() => act.mutate({ path: "/security/sign-out-others" })}>
            Sign out other devices
          </Button>
        </Row>
      </Section>

      <Section title="Your data">
        <Row title="Download my data" detail="One Excel file: expenses, M-Pesa transactions, budgets, bills, accounts and goals">
          <DownloadButton endpoint="/security/export" filename={`expense-tracker-data-${localToday()}.xlsx`} label="Download" size="sm" />
        </Row>
        <Row title="Privacy policy" detail="What we keep, why, and your rights under Kenya's Data Protection Act">
          <Link to="/privacy">
            <Button variant="ghost" size="sm" tabIndex={-1}>
              Read
            </Button>
          </Link>
        </Row>
      </Section>

      <Section title="Delete" danger>
        <Row title="Delete statement data" detail="Remove imported M-Pesa transactions, with or without the expenses they created">
          <Button variant="danger-ghost" size="sm" onClick={() => setDialog("statement")}>
            Delete...
          </Button>
        </Row>
        <Row title="Delete account" detail="Removes your account and everything in it for good">
          <Button variant="danger-ghost" size="sm" onClick={() => setConfirm("account")}>
            Delete account
          </Button>
        </Row>
      </Section>

      {dialog === "pin" && <PinDialog mode="set" onDone={() => setDialog(null)} onCancel={() => setDialog(null)} />}
      {dialog === "password" && <PasswordDialog onClose={() => setDialog(null)} />}
      {dialog === "statement" && <StatementDataDialog onClose={() => setDialog(null)} />}

      <Confirm
        open={confirm === "pin"}
        danger
        title="Turn off your PIN?"
        description="Accounts and the other protected actions will open without it. We'll email you that it was turned off."
        confirmLabel="Turn off PIN"
        loading={act.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => act.mutate({ method: "delete", path: "/security/pin" })}
      />
      <ConfirmDelete
        open={confirm === "account"}
        title="Delete your account?"
        description="Your expenses, statements, budgets, bills, accounts and goals are removed for good. This can't be undone."
        confirmLabel="Delete account"
        loading={act.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => act.mutate({ method: "delete", path: `/profile/${user?.id}`, after: logout })}
      />
    </div>
  );
};

export default Security;
