import { settlePin, usePinRequested } from "@/lib/pin";
import PinDialog from "./PinDialog";

// Shown whenever a request needs the PIN; the request carries on once it's entered.
const PinGate = () => {
  const requested = usePinRequested();
  return requested ? <PinDialog mode="unlock" onDone={() => settlePin(true)} onCancel={() => settlePin(false)} /> : null;
};

export default PinGate;
