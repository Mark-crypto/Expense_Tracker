import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MonthlyAverage = ({ data }) => {
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
        Predicted Average Monthly Spending
      </h4>
      <Table>
        <TableHeader>
          <TableRow className="bg-purple-100 dark:bg-gray-800">
            <TableHead className="w-[60px] text-purple-700 dark:text-gray-300 font-semibold">
              #
            </TableHead>
            <TableHead className="text-purple-700 dark:text-gray-300 font-semibold">
              Month
            </TableHead>
            <TableHead className="text-purple-700 dark:text-gray-300 font-semibold">
              Monthly Average
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((avg, i) => (
            <TableRow
              key={i}
              className={`hover:bg-purple-50 transition duration-200 ${
                i % 2 === 0 ? "bg-gray-50" : "bg-white"
              }`}
            >
              <TableCell className="font-medium text-gray-900 dark:text-white">
                {i + 1}
              </TableCell>
              <TableCell className="text-gray-700 dark:text-gray-300">
                {avg.month}
              </TableCell>
              <TableCell className="text-gray-700 dark:text-gray-300">
                KES {Number(Math.floor(avg.monthly_average)).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default MonthlyAverage;
