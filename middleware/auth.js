/**
 * Authentication & Authorization Middlewares
 */

// Verify that the user is authenticated
exports.isLoggedIn = (req, res, next) => {
  if (!req.session || !req.session.isLoggedIn || !req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// Verify that the authenticated user has the 'host' role
exports.isHost = (req, res, next) => {
  if (!req.session || !req.session.isLoggedIn || !req.session.user) {
    return res.redirect('/auth/login');
  }

  const userType = req.session.user.userType;
  if (userType !== 'host') {
    return res.status(403).render('403', {
      pageTitle: 'Access Forbidden',
      currentPage: '403',
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
      message: 'Access denied. You must be signed in as a Host to access this page.',
    });
  }

  next();
};
