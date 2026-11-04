import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/axiosInstance";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatKES } from "@/lib/format";
import { useSetup } from "@/lib/setup";
import { startTour, stopTour } from "@/lib/tour";
import { MAIN_TOUR } from "@/lib/tourStops";
import SetupDialog from "./SetupDialog";

const BENEFITS = [
  ["Know what's safe to spend today", "after bills and savings."],
  ["See where your M-Pesa really goes", "fees and Fuliza included."],
  ["Hear about bills before they're due", "found for you."],
];

const Welcome = ({ firstName, existing, safe, onTour, onSkip }) => (
  <Dialog open onOpenChange={(open) => !open && onSkip()}>
    <DialogContent className="max-w-[calc(100vw-2rem)] gap-4 sm:max-w-md">
      <div className="grid h-24 place-items-center rounded-xl bg-hero text-center text-white">
        <div>
          <p className="text-xs text-white/70">Safe to spend today</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{safe?.ready ? formatKES(safe.daily) : "Your daily number"}</p>
        </div>
      </div>
      <div className="space-y-1">
        <DialogTitle className="text-xl">
          {existing ? "See what's new" : "Welcome"}
          {firstName ? `, ${firstName}` : ""}
        </DialogTitle>
        <DialogDescription>
          {existing ? "Expense Tracker can now do more with your money." : "Here's what Expense Tracker does for you."}
        </DialogDescription>
      </div>
      <ol className="space-y-2.5">
        {BENEFITS.map(([strong, rest], index) => (
          <li key={strong} className="flex items-start gap-2.5 text-sm">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-semibold text-accent-foreground">
              {index + 1}
            </span>
            <span>
              <strong className="font-semibold">{strong}</strong>, {rest}
            </span>
          </li>
        ))}
      </ol>
      <div className="flex items-center justify-between gap-2 pt-1">
        <Button variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
        <Button onClick={onTour}>Take the tour · 1 min</Button>
      </div>
    </DialogContent>
  </Dialog>
);

// The first-visit welcome and the Dashboard tour. ?tour=1 replays the tour from Help.
const ProductTour = ({ safe }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const { data } = useSetup();
  const [dialog, setDialog] = useState(null);
  const resumeAt = useRef(null);
  const welcoming = data && data.status !== "done";

  const run = useCallback(
    (from = 0) =>
      startTour({
        stops: MAIN_TOUR,
        from,
        doneText: "Finish tour",
        onAction: (action, index) => {
          if (action.kind === "import") return navigate("/import");
          resumeAt.current = index + 1;
          setDialog(action.kind);
        },
      }),
    [navigate]
  );

  // Clearing ?tour=1 re-runs this effect, so the timer is only cleared on leaving the page.
  const replay = useRef(null);
  useEffect(() => {
    if (!params.get("tour")) return;
    setParams({}, { replace: true });
    replay.current = setTimeout(() => run(), 400);
  }, [params, setParams, run]);

  useEffect(
    () => () => {
      clearTimeout(replay.current);
      stopTour();
    },
    []
  );

  // Seen either way; the tour can be replayed from Help.
  const closeWelcome = (tour) => {
    queryClient.setQueryData(["setup"], (old) => ({ ...old, status: "done" }));
    axiosInstance.put("/setup", { status: "done" }).catch(() => {});
    if (tour) setTimeout(() => run(), 300);
  };

  const closeDialog = () => {
    setDialog(null);
    const at = resumeAt.current;
    resumeAt.current = null;
    if (at !== null && at < MAIN_TOUR.length) setTimeout(() => run(at), 300);
  };

  return (
    <>
      {welcoming && (
        <Welcome
          firstName={data.firstName}
          existing={data.status === "existing"}
          safe={safe}
          onTour={() => closeWelcome(true)}
          onSkip={() => closeWelcome(false)}
        />
      )}
      {dialog && <SetupDialog kind={dialog} onClose={closeDialog} />}
    </>
  );
};

export default ProductTour;
