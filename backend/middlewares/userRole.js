export const isUserAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: true,
      message: "You do not have the permissions to access this page.",
    });
  }
  next();
};

export const isProfileOwner = (req, res, next) => {
  if (parseInt(req.params.id) !== parseInt(req.user.userId)) {
    return res.status(403).json({
      error: true,
      message: "You can only access your own profile.",
    });
  }
  next();
};
