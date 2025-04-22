export const isUserAdmin = (req, res, next) => {
  if (req.userInfo.role !== "admin") {
    return res
      .status(401)
      .json({ error: true, message: "You are not authorized as an admin." });
  }
  next();
};
