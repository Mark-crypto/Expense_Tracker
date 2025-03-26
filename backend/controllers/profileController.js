import connection from "../database.js";

// Get profile
export const getProfile = (req, res) => {
  res.send("Get profile");
};

// Update profile
export const updateProfile = (req, res) => {
  const { id } = req.params;
  const {} = req.body;
  res.send("Update profile");
};

// Delete profile
export const deleteProfile = (req, res) => {
  const { id } = req.params;
  res.send("Delete profile");
};
