import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CategoryBudget = ({ data }) => {
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
        Budget Predictions Based on Trends
      </h4>
      <Table>
        <TableHeader>
          <TableRow className="bg-purple-100">
            <TableHead className="w-[60px] font-semibold text-purple-700">
              #
            </TableHead>
            <TableHead className="font-semibold text-purple-700">
              Budget Categories
            </TableHead>
            <TableHead className="font-semibold text-purple-700">
              Total Predicted Expenditure
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.length > 0 ? (
            data?.map((budget, i) => (
              <TableRow
                key={i}
                className={`hover:bg-purple-50 transition duration-200 ${
                  i % 2 === 0 ? "bg-gray-50" : "bg-white"
                }`}
              >
                <TableCell className="font-medium text-gray-700">
                  {i + 1}
                </TableCell>
                <TableCell className="text-gray-800">
                  {budget.category}
                </TableCell>
                <TableCell className="text-gray-800">
                  KES {Number(budget.total).toLocaleString()}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-gray-500">
                No data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
};

export default CategoryBudget;
