import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/axiosInstance";
import { useSetup } from "@/lib/setup";
import { startTour, stopTour } from "@/lib/tour";
import { PAGE_TOURS } from "@/lib/tourStops";

// Runs a page's short tour the first time it opens, once its content is on screen.
export const usePageTour = (tip, ready = true) => {
  const queryClient = useQueryClient();
  const { data } = useSetup();
  const due = ready && !!data && data.status === "done" && !data.tipsSeen.includes(tip);

  useEffect(() => {
    if (!due) return;
    const timer = setTimeout(() => {
      startTour({
        stops: PAGE_TOURS[tip].map((stop) => ({ ...stop, optional: true })),
        doneText: "Got it",
        skipText: "Skip",
        onFinish: () => {
          queryClient.setQueryData(["setup"], (old) => ({ ...old, tipsSeen: [...old.tipsSeen, tip] }));
          axiosInstance.post("/setup/tips", { tip }).catch(() => {});
        },
      });
    }, 700);
    return () => {
      clearTimeout(timer);
      stopTour();
    };
  }, [due, tip, queryClient]);
};
