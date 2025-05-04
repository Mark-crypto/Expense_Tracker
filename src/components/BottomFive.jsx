import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const BottomFive = ({ data }) => {
  return (
    <>
      <Table>
        <TableCaption>Bottom Five Categories</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">#</TableHead>
            <TableHead>Category(Bottom)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((bottom, i) => {
            return (
              <TableRow key={i}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell>{bottom.category}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};
export default BottomFive;
