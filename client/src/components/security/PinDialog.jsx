import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { LockKey } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { isWeakPin } from "@/lib/pin";
import { cn } from "@/lib/utils";
import PinInput from "./PinInput";

const PROTECTS = [
  "Accounts and your balances",
  "Download my data",
  "Deleting statement data or your account",
  "Changing your password",
];

const errorOf = (error) => error.response?.data?.message || "This could not be saved.";

/*
 * mode "unlock": enter the PIN. "set": choose one and enter it again. "reset": password first, then choose.
 * Unlock can switch to reset for a forgotten or locked PIN.
 */
const PinDialog = ({ mode: startMode = "unlock", reason, onDone, onCancel }) => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState(startMode);
  const [step, setStep] = useState(startMode === "reset" ? "password" : "first");
  const [password, setPassword] = useState("");
  const [first, setFirst] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState(null);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [busy, setBusy] = useState(false);

  const finish = (message) => {
    queryClient.invalidateQueries({ queryKey: ["security"] });
    queryClient.invalidateQueries({ queryKey: ["setup"] });
    if (message) toast.success(message);
    onDone();
  };

  const startReset = () => {
    setMode("reset");
    setStep("password");
    setPin("");
    setFirst("");
    setError(null);
  };

  // Four digits submit on their own; nothing to press.
  useEffect(() => {
    if (pin.length < 4 || busy) return;
    const choosing = mode !== "unlock";

    if (choosing && step === "first") {
      if (isWeakPin(pin)) {
        setError(`${pin} is too easy to guess. Choose another PIN.`);
        setPin("");
        return;
      }
      setFirst(pin);
      setPin("");
      setStep("confirm");
      return;
    }
    if (choosing && pin !== first) {
      setError("Those didn't match. Choose your PIN again.");
      setPin("");
      setFirst("");
      setStep("first");
      return;
    }

    setBusy(true);
    const request =
      mode === "unlock"
        ? axiosInstance.post("/security/pin/verify", { pin })
        : mode === "reset"
          ? axiosInstance.post("/security/pin/reset", { password, pin })
          : axiosInstance.post("/security/pin", { pin });
    request
      .then(({ data }) => finish(mode === "unlock" ? null : data.message))
      .catch((failure) => {
        setError(errorOf(failure));
        setLockedUntil(failure.response?.data?.lockedUntil ?? null);
        setPin("");
        if (choosing) {
          setFirst("");
          setStep(mode === "reset" && failure.response?.data?.message?.includes("password") ? "password" : "first");
        }
      })
      .finally(() => setBusy(false));
    // finish only closes the dialog and refreshes queries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const title =
    mode === "unlock"
      ? "Enter your PIN"
      : step === "password"
        ? "Confirm it's you"
        : step === "confirm"
          ? "Enter it again"
          : mode === "reset"
            ? "Choose a new PIN"
            : "Choose a 4-digit PIN";

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-[calc(100vw-2rem)] gap-4 sm:max-w-sm">
        <DialogHeader className="items-center text-center sm:text-center">
          <span className="mb-1 flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <LockKey className="size-5" aria-hidden />
          </span>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "unlock"
              ? reason ?? "It stays unlocked on this device for 10 minutes."
              : step === "password"
                ? "Enter your account password, then choose a new PIN. We'll email you that it changed."
                : step === "confirm"
                  ? "It stays unlocked for 10 minutes after you enter it."
                  : "You'll enter it to open:"}
          </DialogDescription>
        </DialogHeader>

        {mode === "set" && step === "first" && (
          <ul className="mx-auto list-disc space-y-0.5 pl-5 text-sm">
            {PROTECTS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}

        {step === "password" ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              setStep("first");
            }}
          >
            <Field label="Password" htmlFor="pinResetPassword">
              <Input id="pinResetPassword" type="password" required autoComplete="current-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        ) : (
          <>
            <PinInput
              key={`${mode}-${step}`}
              id="pinEntry"
              label={title}
              value={pin}
              error={error && !pin}
              onChange={(value) => {
                setError(null);
                setPin(value);
              }}
            />
            <p
              role={error ? "alert" : undefined}
              className={cn("min-h-5 text-center text-sm", error ? "font-medium text-danger" : "text-muted-foreground")}
            >
              {busy ? "Checking..." : error ?? (mode !== "unlock" && step === "first" ? "Avoid 1234, 0000 or your birth year." : "")}
            </p>
          </>
        )}

        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={onCancel}>
            {mode === "set" ? "Not now" : "Cancel"}
          </Button>
          {mode === "unlock" && (
            <Button variant={lockedUntil ? "secondary" : "ghost"} onClick={startReset}>
              {lockedUntil ? "Reset with my password" : "Forgot PIN?"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PinDialog;
