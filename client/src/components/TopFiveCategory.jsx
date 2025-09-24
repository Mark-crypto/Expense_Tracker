import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TopFiveCategory = ({ data }) => {
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
        Top 5 Predicted Spending Categories
      </h4>
      <Table>
        <TableCaption className="text-sm text-gray-500 mt-2">
          Top Five Categories
        </TableCaption>
        <TableHeader>
          <TableRow className="bg-purple-100">
            <TableHead className="w-[60px] font-semibold  text-purple-700">
              #
            </TableHead>
            <TableHead className="font-semibold  text-purple-700">
              Category
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((top, i) => (
              <TableRow
                key={i}
                className={`hover:bg-green-50 transition duration-200 ${
                  i % 2 === 0 ? "bg-gray-50" : "bg-white"
                }`}
              >
                <TableCell className="font-medium text-gray-700">
                  {i + 1}
                </TableCell>
                <TableCell className="text-gray-800 capitalize">
                  {top.category}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={2} className="text-center py-4">
                No data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
};

export default TopFiveCategory;
