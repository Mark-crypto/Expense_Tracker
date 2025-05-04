import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const BottomFiveRolling = ({ data }) => {
  return (
    <>
      <Table>
        <TableCaption>Bottom Five </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">#</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Rolling Sum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((bottom, i) => {
            return (
              <TableRow key={bottom.expense_id}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell>{bottom.amount}</TableCell>
                <TableCell>{bottom.date_created}</TableCell>
                <TableCell>{bottom.rolling_sum}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};
export default BottomFiveRolling;
