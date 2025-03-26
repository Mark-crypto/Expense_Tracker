import connection from "../database.js";

// Get all budgets
export function getBudget(req, res) {
  res.send("Get all budgets");
}

// Get a single budget
export function getSingleBudget(req, res) {
  const { id } = req.params;
  res.send(`Get budget with id ${id}`);
}

// Add a budget
export function addBudget(req, res) {
  const {} = req.body;
  res.send("Add a budget");
}

// Delete a budget
export function deleteBudget(req, res) {
  const { id } = req.params;
  res.send(`Delete budget with id ${id}`);
}
