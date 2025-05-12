import connection from "../database.js";

// Get profile
export const getProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const [row] = await connection.execute(
      "SELECT * FROM profiles WHERE profile_id = ?",
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
  const { id } = req.params;
  const { name, email, goal } = req.body;
  try {
    const response = await connection.execute(
      "UPDATE profiles SET name=?, email=?, goal=? WHERE profile_id=?",
      [name, email, goal, id]
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
  const { id } = req.params;
  try {
    const response = await connection.execute(
      "DELETE FROM profiles WHERE profile_id = ?",
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
