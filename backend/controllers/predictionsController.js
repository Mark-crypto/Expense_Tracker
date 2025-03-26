import connection from "../database.js";

export const getPredictions = (req, res) => {
  const { id } = req.params;
  res.send("Predictions for user " + id);
};
