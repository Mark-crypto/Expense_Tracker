export const isUserAdmin = (req, res, next) => {
  if (req.userInfo.role !== "admin") {
    return res 
      .status(401)
      .json({
        error: true,
        message: "You do not have the permissions to access this page.",
      });
  }
  next();
};
