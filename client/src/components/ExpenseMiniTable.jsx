import { Card, CardHeader } from "@/components/ui/card";
import { formatDate, formatKES } from "@/lib/format";

const ExpenseMiniTable = ({ title, description, rows = [] }) => (
  <Card>
    <CardHeader title={title} description={description} />
    <div className="overflow-x-auto p-2 pt-3">
      {rows.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-muted-foreground">No expenses yet</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 text-right font-medium">Amount</th>
              <th className="px-3 py-2 text-right font-medium">Running total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.expense_id} className="border-t border-border">
                <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                  {formatDate(row.date_created)}
                </td>
                <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                  {formatKES(row.amount)}
                </td>
                <td className="px-3 py-2.5 text-right text-muted-foreground tabular-nums">
                  {formatKES(row.rolling_sum)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </Card>
);

export default ExpenseMiniTable;
