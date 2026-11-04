import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LockKey } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSetup } from "@/lib/setup";
import PinDialog from "./PinDialog";

// Asked once on Accounts, the page a PIN protects, until it's set or waved off.
const PinSuggestion = () => {
  const queryClient = useQueryClient();
  const { data: setup } = useSetup();
  const { data: security } = useQuery({
    queryKey: ["security"],
    queryFn: async () => (await axiosInstance.get("/security")).data,
  });
  const [setting, setSetting] = useState(false);

  if (!setup || !security || security.pinSet || setup.tipsSeen.includes("pinprompt")) return null;

  const notNow = () => {
    queryClient.setQueryData(["setup"], (old) => ({ ...old, tipsSeen: [...old.tipsSeen, "pinprompt"] }));
    axiosInstance.post("/setup/tips", { tip: "pinprompt" }).catch(() => {});
  };

  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 border-l-[3px] border-l-primary p-4">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <LockKey className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="text-sm font-semibold">Protect your balances with a PIN</p>
          <p className="text-xs text-muted-foreground">Anyone who picks up your phone would need it to open Accounts.</p>
        </div>
      </div>
      <div className="flex gap-1.5">
        <Button variant="ghost" size="sm" onClick={notNow}>
          Not now
        </Button>
        <Button size="sm" onClick={() => setSetting(true)}>
          Set a PIN
        </Button>
      </div>
      {setting && <PinDialog mode="set" onDone={() => setSetting(false)} onCancel={() => setSetting(false)} />}
    </Card>
  );
};

export default PinSuggestion;
