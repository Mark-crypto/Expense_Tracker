import { categoryLabel } from "@/lib/categories";
import { formatKES } from "@/lib/format";

const MAX_ROWS = 7;

// Ranked bars on one baseline: the parts compare more exactly than in a pie.
const CategoryBars = ({ items = [] }) => {
  const sorted = items
    .map((item) => ({ label: categoryLabel(item.category), total: Number(item.total) }))
    .sort((a, b) => b.total - a.total);

  const rest = sorted.slice(MAX_ROWS - 1);
  const rows =
    sorted.length > MAX_ROWS
      ? [
          ...sorted.slice(0, MAX_ROWS - 1),
          { label: `Other (${rest.length})`, total: rest.reduce((sum, row) => sum + row.total, 0) },
        ]
      : sorted;

  const grandTotal = sorted.reduce((sum, row) => sum + row.total, 0);
  const largest = Math.max(...rows.map((row) => row.total), 1);

  return (
    <ul className="space-y-3.5">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{row.label}</span>
            <span className="shrink-0 font-medium tabular-nums">
              {formatKES(row.total)}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                {grandTotal ? Math.round((row.total / grandTotal) * 100) : 0}%
              </span>
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(row.total / largest) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
};

export default CategoryBars;
