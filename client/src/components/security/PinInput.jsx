import { useRef } from "react";
import { Backspace } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

// Four boxes over one real input, so typing, pasting and screen readers all work.
// Phones also get a number pad, so the PIN can be tapped without the keyboard.
const PinInput = ({ id, label, value, onChange, error }) => {
  const input = useRef(null);
  const desktop = typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches;
  const press = (key) => onChange(key === "back" ? value.slice(0, -1) : (value + key).slice(0, 4));

  return (
    <div className="space-y-4">
      <div className="relative mx-auto flex w-fit gap-2.5" onClick={() => input.current?.focus()}>
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            aria-hidden
            className={cn(
              "flex h-14 w-12 items-center justify-center rounded-xl border-[1.5px] border-border bg-card text-2xl font-bold",
              value.length > index && "border-primary",
              value.length === index && "border-primary ring-[3px] ring-primary/15",
              error && "border-danger ring-0"
            )}
          >
            {value[index] ? "•" : ""}
          </span>
        ))}
        <input
          ref={input}
          id={id}
          aria-label={label}
          aria-invalid={!!error}
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          autoFocus={desktop}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>
      <div className="mx-auto grid max-w-64 grid-cols-3 gap-1.5 sm:hidden">
        {KEYS.map((key, index) =>
          key === "" ? (
            <span key={index} />
          ) : (
            <button
              key={key}
              type="button"
              aria-label={key === "back" ? "Delete last digit" : key}
              onClick={() => press(key)}
              className="flex h-11 items-center justify-center rounded-xl border border-border bg-card text-lg font-medium active:bg-muted"
            >
              {key === "back" ? <Backspace className="size-5" aria-hidden /> : key}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default PinInput;
