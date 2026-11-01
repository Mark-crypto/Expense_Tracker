import { useState } from "react";
import { Check } from "@phosphor-icons/react";
import ImportDone from "@/components/import/ImportDone";
import ImportReview from "@/components/import/ImportReview";
import StatementUpload from "@/components/import/StatementUpload";
import { cn } from "@/lib/utils";

const STEPS = ["Upload", "Review", "Done"];

const Steps = ({ current }) => (
  <ol className="flex items-center gap-2 text-sm" aria-label="Import progress">
    {STEPS.map((label, index) => (
      <li
        key={label}
        aria-current={index === current ? "step" : undefined}
        className={cn("flex items-center gap-2", index === current ? "font-medium text-foreground" : "text-muted-foreground")}
      >
        {index > 0 && <span className="h-px w-5 bg-border sm:w-8" aria-hidden />}
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
            index <= current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          {index < current ? <Check className="size-3" weight="bold" aria-hidden /> : index + 1}
        </span>
        {label}
      </li>
    ))}
  </ol>
);

const Import = () => {
  const [statement, setStatement] = useState(null);
  const [savedCount, setSavedCount] = useState(null);
  const step = savedCount !== null ? 2 : statement ? 1 : 0;

  const restart = () => {
    setStatement(null);
    setSavedCount(null);
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl">Import M-Pesa statement</h1>
        <Steps current={step} />
      </header>

      {step === 0 && <StatementUpload onRead={setStatement} />}
      {step === 1 && <ImportReview statement={statement} onBack={restart} onSaved={setSavedCount} />}
      {step === 2 && <ImportDone xray={statement.xray} savedCount={savedCount} onAnother={restart} />}
    </div>
  );
};

export default Import;
