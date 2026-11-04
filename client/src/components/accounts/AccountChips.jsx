import { accountColor } from "@/lib/accounts";
import { cn } from "@/lib/utils";

const AccountChips = ({ accounts, value, onChange, label = "Paid from" }) => (
  <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
    {accounts.map((account) => (
      <button
        key={account.id}
        type="button"
        aria-pressed={value === account.id}
        onClick={() => onChange(account.id)}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium transition-colors hover:bg-muted",
          value === account.id && "border-primary bg-accent text-accent-foreground"
        )}
      >
        <span className="size-2 rounded-sm" style={{ background: accountColor(account.type) }} aria-hidden />
        {account.name}
      </button>
    ))}
  </div>
);

export default AccountChips;
