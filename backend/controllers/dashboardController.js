import connection from "../database.js";

export const getReports = (req, res) => {
  const { id } = req.params;
  res.send("Reports for user " + id);
};
