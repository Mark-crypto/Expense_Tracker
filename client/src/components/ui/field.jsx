import { cn } from "@/lib/utils";

const controlStyles =
  "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/25 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger aria-invalid:focus:ring-danger/25";

export const Input = ({ className, ...props }) => (
  <input className={cn(controlStyles, className)} {...props} />
);

export const Select = ({ className, children, ...props }) => (
  <select className={cn(controlStyles, "pr-8", className)} {...props}>
    {children}
  </select>
);

export const Label = ({ className, ...props }) => (
  <label
    className={cn("text-sm font-medium text-foreground", className)}
    {...props}
  />
);

export const FieldError = ({ children, className }) =>
  children ? (
    <p role="alert" className={cn("text-xs text-danger", className)}>
      {children}
    </p>
  ) : null;

export const Field = ({ label, htmlFor, error, hint, action, className, children }) => (
  <div className={cn("space-y-1.5", className)}>
    <div className="flex items-center justify-between gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {action}
    </div>
    {children}
    {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    <FieldError>{error}</FieldError>
  </div>
);

export const CheckboxCard = ({ id, title, description, className, ...props }) => (
  <label
    htmlFor={id}
    className={cn(
      "flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/60 has-checked:border-primary has-checked:bg-accent/60",
      className
    )}
  >
    <input id={id} type="checkbox" className="mt-0.5 size-4" {...props} />
    <span>
      <span className="block text-sm font-medium">{title}</span>
      {description && (
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {description}
        </span>
      )}
    </span>
  </label>
);
