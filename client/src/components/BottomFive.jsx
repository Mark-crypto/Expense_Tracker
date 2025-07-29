import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const BottomFive = ({ data }) => {
  return (
    <>
      <h4
        className="text-lg font-semibold text-purple-700 mb-4"
        style={{
          fontWeight: "650",
          color: "#9D00FF",
          fontSize: "18px",
          marginBottom: "16px",
        }}
      >
        Bottom 5 Predicted Spending Categories
      </h4>
      <Table>
        <TableHeader>
          <TableRow className="bg-purple-100">
            <TableHead className="w-[60px] font-semibold text-purple-700">
              #
            </TableHead>
            <TableHead className="font-semibold text-purple-700">
              Category
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((bottom, i) => (
            <TableRow
              key={i}
              className={`hover:bg-purple-50 transition duration-200 ${
                i % 2 === 0 ? "bg-gray-50" : "bg-white"
              }`}
            >
              <TableCell className="font-medium text-gray-700">
                {i + 1}
              </TableCell>
              <TableCell className="text-gray-800 capitalize">
                {bottom.category}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default BottomFive;
