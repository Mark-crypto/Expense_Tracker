import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const BottomFiveRolling = ({ data }) => {
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
        Last Five Expenses
      </h4>
      <Table>
        <TableHeader>
          <TableRow className="bg-purple-100 text-purple-800">
            <TableHead className="w-[50px] font-semibold text-sm uppercase">
              #
            </TableHead>
            <TableHead className="font-semibold text-sm uppercase">
              Amount
            </TableHead>
            <TableHead className="font-semibold text-sm uppercase">
              Date
            </TableHead>
            <TableHead className="font-semibold text-sm uppercase">
              Rolling Sum
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((bottom, i) => {
              return (
                <TableRow
                  key={bottom.expense_id}
                  className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}
                >
                  <TableCell className="font-medium text-sm text-gray-700">
                    {i + 1}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    Sh. {Math.floor(bottom.amount).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {bottom.date_created.split("T")[0]}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    Sh. {Math.floor(bottom.rolling_sum).toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-sm text-gray-500"
              >
                No data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
};
export default BottomFiveRolling;
