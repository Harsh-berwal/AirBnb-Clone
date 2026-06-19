const Home = require("../models/home");
const User = require("../models/users");

const getSessionUserId = (req) => {
  if (!req.session.user) {
    return null;
  }

  return req.session.user.id || req.session.user._id || null;
};

exports.getIndex = (req, res, next) => {
  Home.find()
    .then((registeredHomes) => {
      res.render("store/index", {
        registeredHomes: registeredHomes,
        pageTitle: "Home",
        currentPage: "index",
        user: req.session.user,
      });
    })
    .catch((err) => {
      console.error("Error fetching homes: ", err);
    });
};

exports.getHomes = (req, res, next) => {
  Home.find()
    .then((registeredHomes) => {
      res.render("store/home-list", {
        registeredHomes: registeredHomes,
        pageTitle: "All Homes",
        currentPage: "homes",
        user: req.session.user,
      });
    })
    .catch((err) => {
      console.error("Error fetching homes: ", err);
    });
};

exports.getBookings = (req, res, next) => {
  res.render("store/bookings", {
    pageTitle: "My Bookings",
    currentPage: "bookings",
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};

exports.getHomesDetails = (req, res, next) => {
  const homeId = req.params.homeId;
  Home.findById(homeId).then((home) => {
    if (!home) {
      res.redirect("/homes");
    } else {
      res.render("store/home-detail", {
        pageTitle: "Home Details",
        currentPage: "home",
        home: home,
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
      });
    }
  });
};

exports.getFavouriteList = async (req, res, next) => {
  const userId = getSessionUserId(req);

  if (!userId) {
    return res.redirect("/auth/login");
  }

  const user = await User.findById(userId).populate("favouriteHomes");

  if (!user) {
    return res.redirect("/auth/login");
  }

  res.render("store/favourite-list", {
    pageTitle: "My Favourites",
    currentPage: "favourites",
    favouriteHomes: user.favouriteHomes || [],
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};

exports.postAddToFavourite = async (req, res, next) => {
  const homeId = req.body.homeId;
  const userId = getSessionUserId(req);

  if (!userId) {
    return res.redirect("/auth/login");
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.redirect("/auth/login");
  }

  const alreadyExists = user.favouriteHomes.some(
    (id) => id.toString() === homeId,
  );

  if (!alreadyExists) {
    const homeId = Array.isArray(req.body.homeId)
      ? req.body.homeId[0]
      : req.body.homeId;
    user.favouriteHomes.push(homeId);
    await user.save();
  }

  res.redirect("/favourites");
};

exports.postRemoveFromFavourite = async (req, res, next) => {
  const homeId = req.params.homeId;
  const userId = getSessionUserId(req);

  if (!userId) {
    return res.redirect("/auth/login");
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.redirect("/auth/login");
  }

  user.favouriteHomes = user.favouriteHomes.filter(
    (id) => id.toString() !== homeId,
  );

  await user.save();

  res.redirect("/favourites");
};
