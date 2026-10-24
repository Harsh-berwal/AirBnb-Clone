const mongoose = require("mongoose");
const Home = require("../models/home");
const User = require("../models/users");

const getSessionUserId = (req) => {
  if (!req.session || !req.session.user) {
    return null;
  }
  return req.session.user._id || req.session.user.id || null;
};

exports.getIndex = async (req, res, next) => {
  try {
    const registeredHomes = await Home.find();
    res.render("store/index", {
      registeredHomes: registeredHomes || [],
      pageTitle: "Home",
      currentPage: "index",
      isLoggedIn: req.isLoggedIn,
      user: req.session ? req.session.user : null,
    });
  } catch (err) {
    next(err);
  }
};

exports.getHomes = async (req, res, next) => {
  try {
    const registeredHomes = await Home.find();
    res.render("store/home-list", {
      registeredHomes: registeredHomes || [],
      pageTitle: "All Homes",
      currentPage: "homes",
      isLoggedIn: req.isLoggedIn,
      user: req.session ? req.session.user : null,
    });
  } catch (err) {
    next(err);
  }
};

exports.getBookings = (req, res, next) => {
  res.render("store/bookings", {
    pageTitle: "My Bookings",
    currentPage: "bookings",
    isLoggedIn: req.isLoggedIn,
    user: req.session ? req.session.user : null,
  });
};

exports.getHomesDetails = async (req, res, next) => {
  try {
    const homeId = req.params.homeId;

    if (!mongoose.Types.ObjectId.isValid(homeId)) {
      return res.status(404).render("404", {
        pageTitle: "Home Not Found",
        currentPage: "404",
        isLoggedIn: req.isLoggedIn,
        user: req.session ? req.session.user : null,
      });
    }

    const home = await Home.findById(homeId);
    if (!home) {
      return res.status(404).render("404", {
        pageTitle: "Home Not Found",
        currentPage: "404",
        isLoggedIn: req.isLoggedIn,
        user: req.session ? req.session.user : null,
      });
    }

    res.render("store/home-detail", {
      pageTitle: home.homeName || "Home Details",
      currentPage: "home",
      home: home,
      isLoggedIn: req.isLoggedIn,
      user: req.session ? req.session.user : null,
    });
  } catch (err) {
    next(err);
  }
};

exports.getFavouriteList = async (req, res, next) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.redirect("/auth/login");
    }

    const user = await User.findById(userId).populate("favouriteHomes");
    if (!user) {
      return res.redirect("/auth/login");
    }

    // Filter out null or missing populated items to protect against crashes
    const validFavourites = (user.favouriteHomes || []).filter(Boolean);

    res.render("store/favourite-list", {
      pageTitle: "My Favourites",
      currentPage: "favourites",
      favouriteHomes: validFavourites,
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    next(err);
  }
};

exports.postAddToFavourite = async (req, res, next) => {
  try {
    const rawHomeId = Array.isArray(req.body.homeId)
      ? req.body.homeId[0]
      : req.body.homeId;

    if (!rawHomeId || !mongoose.Types.ObjectId.isValid(rawHomeId)) {
      return res.redirect("/homes");
    }

    const homeId = rawHomeId.toString();
    const userId = getSessionUserId(req);

    if (!userId) {
      return res.redirect("/auth/login");
    }

    const [user, homeExists] = await Promise.all([
      User.findById(userId),
      Home.findById(homeId),
    ]);

    if (!user) {
      return res.redirect("/auth/login");
    }

    // Ensure the home actually exists before adding to favourites
    if (!homeExists) {
      return res.redirect("/homes");
    }

    const alreadyExists = user.favouriteHomes.some(
      (id) => (id._id || id).toString() === homeId
    );

    if (!alreadyExists) {
      user.favouriteHomes.push(homeId);
      await user.save();
    }

    res.redirect("/favourites");
  } catch (err) {
    next(err);
  }
};

exports.postRemoveFromFavourite = async (req, res, next) => {
  try {
    const homeId = req.params.homeId;
    const userId = getSessionUserId(req);

    if (!userId) {
      return res.redirect("/auth/login");
    }

    if (!homeId || !mongoose.Types.ObjectId.isValid(homeId)) {
      return res.redirect("/favourites");
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.redirect("/auth/login");
    }

    user.favouriteHomes = (user.favouriteHomes || []).filter(
      (id) => (id._id || id).toString() !== homeId.toString()
    );

    await user.save();
    res.redirect("/favourites");
  } catch (err) {
    next(err);
  }
};
