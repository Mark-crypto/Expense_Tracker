import { categoryLabel } from "@/lib/categories";
import { formatKES } from "@/lib/format";
import { cn } from "@/lib/utils";

const MAX_ROWS = 7;

// Ranked bars on one baseline: the parts compare more exactly than in a pie.
const CategoryBars = ({ items = [], selected, onSelect }) => {
  const sorted = items
    .map((item) => ({
      key: item.category,
      label: categoryLabel(item.category),
      total: Number(item.total),
    }))
    .sort((a, b) => b.total - a.total);

  const rest = sorted.slice(MAX_ROWS - 1);
  const rows =
    sorted.length > MAX_ROWS
      ? [
          ...sorted.slice(0, MAX_ROWS - 1),
          {
            key: null,
            label: `Other (${rest.length})`,
            total: rest.reduce((sum, row) => sum + row.total, 0),
          },
        ]
      : sorted;

  const grandTotal = sorted.reduce((sum, row) => sum + row.total, 0);
  const largest = Math.max(...rows.map((row) => row.total), 1);

  return (
    <ul className="space-y-1">
      {rows.map((row) => {
        const content = (
          <>
            <span className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate">{row.label}</span>
              <span className="shrink-0 font-medium tabular-nums">
                {formatKES(row.total)}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {grandTotal ? Math.round((row.total / grandTotal) * 100) : 0}%
                </span>
              </span>
            </span>
            <span className="block h-1.5 rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${(row.total / largest) * 100}%` }}
              />
            </span>
          </>
        );

        return (
          <li key={row.label}>
            {onSelect && row.key ? (
              <button
                type="button"
                aria-pressed={selected === row.key}
                onClick={() => onSelect(row.key)}
                className={cn(
                  "block w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/70",
                  selected === row.key && "bg-accent hover:bg-accent",
                  selected && selected !== row.key && "opacity-50"
                )}
              >
                {content}
              </button>
            ) : (
              <div className={cn("px-2 py-1.5", selected && "opacity-50")}>{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default CategoryBars;
