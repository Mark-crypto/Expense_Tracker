import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { monthName, signedChange, signedKES } from "@/lib/accounts";
import { formatKES } from "@/lib/format";
import { balancesHidden, MASK } from "@/lib/privacy";

const number = (value) => balancesHidden() ? MASK : (value < 0 ? `−${(-value).toLocaleString("en-KE")}` : value.toLocaleString("en-KE"));

const summary = ({ biggestFall, totals }) => {
  const direction =
    totals.change < 0
      ? `Your total fell ${formatKES(-totals.change)}.`
      : totals.change > 0
        ? `Your total rose ${formatKES(totals.change)}.`
        : "Your total held steady.";
  return biggestFall ? `${biggestFall} took the biggest hit. ${direction}` : direction;
};

const MonthReport = ({ report, months, onMonth }) => {
  const index = months.indexOf(report.month);
  const showAdjusted = report.rows.some((row) => row.adjusted !== 0);

  return (
    <Card>
      <CardHeader
        title={`${monthName(report.month)} report${report.complete ? "" : " so far"}`}
        description={summary(report)}
        action={
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="size-8" aria-label="Earlier month" disabled={index === months.length - 1} onClick={() => onMonth(months[index + 1])}>
              <CaretLeft />
            </Button>
            <Button variant="ghost" size="icon" className="size-8" aria-label="Later month" disabled={index === 0} onClick={() => onMonth(months[index - 1])}>
              <CaretRight />
            </Button>
          </div>
        }
      />
      <CardContent className="pt-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Start</TableHead>
              <TableHead className="hidden text-right sm:table-cell">In</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Out</TableHead>
              {showAdjusted && <TableHead className="hidden text-right sm:table-cell">Unrecorded</TableHead>}
              <TableHead className="text-right">End</TableHead>
              <TableHead className="text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.rows.map((row) => (
              <TableRow key={row.id} className="tabular-nums">
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-right">{number(row.start)}</TableCell>
                <TableCell className="hidden text-right sm:table-cell">{number(row.moneyIn)}</TableCell>
                <TableCell className="hidden text-right sm:table-cell">{number(row.moneyOut)}</TableCell>
                {showAdjusted && <TableCell className="hidden text-right sm:table-cell">{signedChange(row.adjusted)}</TableCell>}
                <TableCell className="text-right">{number(row.end)}</TableCell>
                <TableCell className="text-right">{signedChange(row.change)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="font-semibold tabular-nums">
              <TableCell>All accounts</TableCell>
              <TableCell className="text-right">{number(report.totals.start)}</TableCell>
              <TableCell className="hidden text-right sm:table-cell">{number(report.totals.moneyIn)}</TableCell>
              <TableCell className="hidden text-right sm:table-cell">{number(report.totals.moneyOut)}</TableCell>
              {showAdjusted && <TableCell className="hidden text-right sm:table-cell">{signedChange(report.totals.adjusted)}</TableCell>}
              <TableCell className="text-right">{number(report.totals.end)}</TableCell>
              <TableCell className="text-right">{signedChange(report.totals.change)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
        <p className="mt-2 text-xs text-muted-foreground">
          In and Out include moves between your accounts, so Change shows what really left.
          {showAdjusted && ` Unrecorded is the gap your balance updates closed: ${signedKES(report.totals.adjusted)} this month.`}
        </p>
      </CardContent>
    </Card>
  );
};

export default MonthReport;
