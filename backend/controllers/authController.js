import connection from "../database.js";

export const signUp = async (req, res) => {
  const {} = req.body;
  const {} = req.params;
  res.send("Sign up route");
};

export const login = async (req, res) => {
  const {} = req.body;
  res.send("Login route");
};

export const logout = async (req, res) => {
  const {} = req.params;
  res.send("Logout route");
};
