import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MonthlyAverage = ({ data }) => {
  return (
    <>
      <Table>
        <TableCaption>Month vs Average</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">#</TableHead>
            <TableHead>Month</TableHead>
            <TableHead>Monthly Average</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((avg, i) => {
            return (
              <TableRow key={i}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell>{avg.month}</TableCell>
                <TableCell>{avg.monthly_average}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};
export default MonthlyAverage;
