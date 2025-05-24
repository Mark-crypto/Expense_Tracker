import connection from "../database.js";

// Get profile
export const getProfile = async (req, res) => {
  let { id } = req.params;
  id = parseInt(id);
  try {
    const [row] = await connection.execute(
      "SELECT user_id, name, email, goal, age,occupation FROM users WHERE user_id = ?",
      [id]
    );
    res
      .status(200)
      .json({ data: row[0], message: "Profile retrieved successfully." });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ error: true, message: "Something went wrong." });
  }
};

// Update profile
export const updateProfile = async (req, res) => {
  let { id } = req.params;
  id = parseInt(id);
  const { name, occupation, age, goal } = req.body;
  try {
    const response = await connection.execute(
      "UPDATE users SET name=?, occupation=?, age=?, goal=? WHERE user_id=?",
      [name, occupation, age, goal, id]
    );
    if (!response) {
      return res.status(400).json({
        error: true,
        message: "Something went wrong. Try again later.",
      });
    }
    res.status(200).json({ message: "Records updated successfully" });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// Delete profile
export const deleteProfile = async (req, res) => {
  let { id } = req.params;
  id = parseInt(id);
  try {
    const response = await connection.execute(
      "DELETE FROM users WHERE user_id = ?",
      [id]
    );
    if (!response) {
      return res.status(400).json({
        error: true,
        message: "Something went wrong. Try again later.",
      });
    }
    res.status(200).json({ message: "Records deleted successfully" });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};
