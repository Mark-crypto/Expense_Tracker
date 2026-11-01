export const ChartTooltip = ({ title, rows }) => (
  <div className="rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-lg">
    <p className="mb-1 text-xs text-muted-foreground">{title}</p>
    {rows.map(([value, label]) => (
      <p key={label} className="text-xs text-muted-foreground">
        <span className="mr-1.5 text-sm font-semibold text-foreground tabular-nums">{value}</span>
        {label}
      </p>
    ))}
  </div>
);
