import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CategoryBudget = ({ data }) => {
  return (
    <>
      <Table>
        <TableCaption>Category vs Total</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">#</TableHead>
            <TableHead>Budget Categories</TableHead>
            <TableHead>Total Expected Expenditure</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((budget, i) => {
            return (
              <TableRow key={i}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell>{budget.category}</TableCell>
                <TableCell>{budget.total}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};
export default CategoryBudget;
