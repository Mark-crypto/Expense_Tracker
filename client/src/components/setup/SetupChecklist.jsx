import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Check } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SETUP_ITEMS, useSetup } from "@/lib/setup";
import { cn } from "@/lib/utils";
import SetupDialog from "./SetupDialog";

// What helps most if it's set up first. Done items stay, ticked, so progress shows.
const SetupChecklist = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useSetup();
  const [open, setOpen] = useState(null);

  // Saved in the background; the card goes straight away.
  const hide = () => {
    queryClient.setQueryData(["setup"], (old) => ({ ...old, hidden: true }));
    axiosInstance.post("/setup/hide").catch(() => {});
  };
  const closeAllSet = () => {
    queryClient.setQueryData(["setup"], (old) => ({ ...old, tipsSeen: [...old.tipsSeen, "allset"] }));
    axiosInstance.post("/setup/tips", { tip: "allset" }).catch(() => {});
  };

  if (!data || data.hidden) return null;
  const doneCount = SETUP_ITEMS.filter((item) => data.done[item.key]).length;
  const allDone = doneCount === SETUP_ITEMS.length;
  if (allDone && data.tipsSeen.includes("allset")) return null;

  if (allDone) {
    return (
      <Card data-tour="checklist" className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success text-white">
            <Check className="size-5" weight="bold" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold">All set{data.firstName ? `, ${data.firstName}` : ""}</h2>
            <p className="text-sm text-muted-foreground">Your numbers now come from your own money. Replay the tour any time from Help.</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={closeAllSet}>
          Done
        </Button>
      </Card>
    );
  }

  const start = (item) => (item.kind === "statement" ? navigate("/import") : setOpen(item.kind));

  return (
    <Card data-tour="checklist" className="space-y-3 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Get started</h2>
        <Button variant="ghost" size="sm" onClick={hide}>
          Hide
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-label="Get started progress"
          aria-valuemin={0}
          aria-valuemax={SETUP_ITEMS.length}
          aria-valuenow={doneCount}
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${(doneCount / SETUP_ITEMS.length) * 100}%` }} />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {doneCount} of {SETUP_ITEMS.length}
        </span>
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border">
        {SETUP_ITEMS.map((item) => {
          const done = data.done[item.key];
          return (
            <li key={item.key} className="flex items-center gap-3 px-3 py-2.5">
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px]",
                  done ? "border-success bg-success text-white" : "border-border"
                )}
              >
                {done && <Check className="size-3" weight="bold" aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium", done && "text-muted-foreground line-through")}>
                  {item.title}
                  <span className="sr-only">{done ? ", done" : ""}</span>
                </p>
                <p className="text-xs text-muted-foreground">{item.why}</p>
              </div>
              {!done && (
                <Button variant="secondary" size="sm" onClick={() => start(item)}>
                  {item.action}
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {open && <SetupDialog kind={open} onClose={() => setOpen(null)} />}
    </Card>
  );
};

export default SetupChecklist;
