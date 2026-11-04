import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { STOP_REASONS } from "@/lib/bills";
import { cn } from "@/lib/utils";

export const StopDialog = ({ bill, pending, onClose, onStop }) => {
  const [reason, setReason] = useState(null);
  const [note, setNote] = useState("");

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Stop tracking {bill.name}?</DialogTitle>
          <DialogDescription>
            Future payments won't be added. Past expenses stay, and you can restart it any time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Why? (optional)</p>
            <div className="flex flex-wrap gap-1.5">
              {STOP_REASONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={reason === value}
                  onClick={() => setReason(reason === value ? null : value)}
                  className={cn(
                    "h-8 rounded-full border border-border px-3 text-xs font-medium transition-colors hover:bg-muted",
                    reason === value && "border-primary bg-accent text-accent-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Field label="Note (optional)" htmlFor="stopNote">
            <Input id="stopNote" maxLength={255} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Keep tracking
            </Button>
            <Button loading={pending} onClick={() => onStop({ reason, note })}>
              Stop tracking
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Payments that change each time need the real amount; fixed ones take one tap.
export const PaidDialog = ({ bill, pending, onClose, onPaid }) => {
  const [amount, setAmount] = useState(bill.amount);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>How much did you pay for {bill.name}?</DialogTitle>
          <DialogDescription>This is saved as today's expense.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (Number(amount) > 0) onPaid(Number(amount));
          }}
        >
          <Field label="Amount (KES)" htmlFor="paidAmount">
            <Input
              id="paidAmount"
              type="number"
              inputMode="decimal"
              step="0.01"
              className="tabular-nums"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Button type="submit" className="w-full" loading={pending}>
            Mark paid
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
