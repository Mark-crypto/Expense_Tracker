import connection from "../database.js";

export const signUp = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    connection.execute(
      "INSERT INTO users SET name=?, email=?, password=?",
      [name, email, password],
      (error, data) => {
        if (error) {
          res.status(500).json({ error: true, message: "Error signing up" });
        }
        res.status(201).json({ data, message: "User created successfully" });
      }
    );
  } catch (error) {
    res.status(500).json({ error: true, message: "Error signing up" });
  }
};

export const login = async (req, res) => {};

export const getUser = (req, res) => {
  const { email, password } = req.body;
  const { id } = req.params;
  connection.execute(
    "SELECT * FROM users WHERE user_id = ?",
    [id],
    (error, data) => {
      if (error) {
        res.status(500).json({ error: true, message: "Error fetching user" });
      }
      res.status(200).json({ data });
    }
  );
};

export const logout = async (req, res) => {
  const {} = req.params;
  res.send("Logout route");
};
