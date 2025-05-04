import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CategoryExpense = ({ data }) => {
  return (
    <>
      <Table>
        <TableCaption>Expenditure per category</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">#</TableHead>
            <TableHead>Category Expense</TableHead>
            <TableHead>Total Expense Expected </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((expense, i) => {
            return (
              <TableRow key={i}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell>{expense.total}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};
export default CategoryExpense;
