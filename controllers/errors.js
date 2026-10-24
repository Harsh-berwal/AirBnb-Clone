exports.pageNotFound = (req, res, next) => {
  res.status(404).render("404", { 
    pageTitle: "Page Not Found", 
    currentPage: "404",
    isLoggedIn: req.isLoggedIn,
    user: req.session ? req.session.user : null,
  });
};

exports.get500 = (err, req, res, next) => {
  console.error("Internal Server Error:", err.message || err);
  const status = err.status || 500;
  res.status(status).render("500", {
    pageTitle: "Error",
    currentPage: "500",
    isLoggedIn: req.isLoggedIn,
    user: req.session ? req.session.user : null,
    errorMessage: status === 500 ? "An unexpected error occurred. Please try again." : err.message,
  });
};

