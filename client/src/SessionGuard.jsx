import { useEffect, useRef, useState } from "react";
import { publicAxios } from "@/axiosInstance";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { IDLE_MS, RENEW_MS, WARN_MS, shareActivity, sharedActivity } from "@/lib/session";

const ACTIVITY = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"];
const TICK_MS = 1000;
const SHARE_EVERY_MS = 15 * 1000;

const minutesAndSeconds = (ms) => {
  const seconds = Math.max(Math.ceil(ms / 1000), 0);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

/*
 * Logs out after an hour without moving the mouse, typing, tapping or scrolling, in any tab,
 * with a warning two minutes before. While someone is active, the sign-in is renewed quietly;
 * the server refuses to renew one left idle, so closing the tab doesn't keep it alive.
 */
const SessionGuard = () => {
  const { isAuthenticated, logout } = useAuth();
  const lastActive = useRef(Date.now());
  const lastShared = useRef(0);
  const lastRenewed = useRef(Date.now());
  const [left, setLeft] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    lastActive.current = Math.max(Date.now(), sharedActivity());
    shareActivity(lastActive.current);

    const markActive = () => {
      const now = Date.now();
      lastActive.current = now;
      if (now - lastShared.current > SHARE_EVERY_MS) {
        shareActivity(now);
        lastShared.current = now;
      }
    };

    const renew = () => {
      lastRenewed.current = Date.now();
      publicAxios.post("/auth/refresh").catch((error) => {
        if ([401, 403].includes(error.response?.status)) logout(error.response.data?.reason === "idle" ? "idle" : "expired");
      });
    };

    const check = () => {
      const now = Date.now();
      const idle = now - Math.max(lastActive.current, sharedActivity());
      if (idle >= IDLE_MS) return logout("idle");
      setLeft(idle >= IDLE_MS - WARN_MS ? IDLE_MS - idle : null);
      if (idle < RENEW_MS && now - lastRenewed.current >= RENEW_MS) renew();
    };

    ACTIVITY.forEach((name) => window.addEventListener(name, markActive, { passive: true }));
    const timer = setInterval(check, TICK_MS);
    check();
    return () => {
      ACTIVITY.forEach((name) => window.removeEventListener(name, markActive));
      clearInterval(timer);
    };
  }, [isAuthenticated, logout]);

  if (!isAuthenticated || left === null) return null;

  return (
    <Dialog open onOpenChange={() => setLeft(null)}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Still there?</DialogTitle>
          <DialogDescription>
            For your security, you&apos;ll be logged out in{" "}
            <strong className="font-semibold text-foreground tabular-nums">{minutesAndSeconds(left)}</strong> because there&apos;s been no
            activity for almost an hour.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => logout()}>
            Log out now
          </Button>
          <Button
            onClick={() => {
              lastActive.current = Date.now();
              shareActivity(lastActive.current);
              setLeft(null);
            }}
          >
            Stay signed in
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionGuard;
