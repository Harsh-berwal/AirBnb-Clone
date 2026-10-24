const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const Home = require("../models/home");
const User = require("../models/users");
const rootDir = require("../utils/pathUtil");

// Helper: Safely delete an uploaded file within the uploads directory
const safeDeleteFile = (relativePath) => {
  if (!relativePath || typeof relativePath !== "string") return;
  try {
    const cleaned = relativePath.replace(/^[/\\]+/, "");
    const absolutePath = path.join(rootDir, cleaned);
    const uploadsDir = path.join(rootDir, "uploads");

    // Ensure path resolves inside uploads directory to prevent path traversal
    if (absolutePath.startsWith(uploadsDir) && fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (err) {
    console.error("Error deleting file:", err.message);
  }
};

exports.getAddHome = (req, res, next) => {
  res.render("host/edit-home", {
    pageTitle: "Add Home to airbnb",
    currentPage: "addHome",
    editing: false,
    home: {},
    errors: [],
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};

exports.getEditHome = async (req, res, next) => {
  try {
    const homeId = req.params.homeId;
    const editing = req.query.editing === "true";

    if (!mongoose.Types.ObjectId.isValid(homeId)) {
      return res.status(404).render("404", {
        pageTitle: "Home Not Found",
        currentPage: "404",
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
      });
    }

    const home = await Home.findById(homeId);

    if (!home) {
      return res.status(404).render("404", {
        pageTitle: "Home Not Found",
        currentPage: "404",
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
      });
    }

    // Verify ownership: only the host who created the home may edit it
    const currentUserId = (req.session.user._id || req.session.user.id || "").toString();
    if (!home.host || home.host.toString() !== currentUserId) {
      return res.status(403).render("403", {
        pageTitle: "Access Denied",
        currentPage: "403",
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
        message: "You are not authorized to edit this listing.",
      });
    }

    res.render("host/edit-home", {
      pageTitle: "Edit Home",
      currentPage: "host-homes",
      editing: editing,
      home: home,
      errors: [],
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    next(err);
  }
};

exports.getHostHomes = async (req, res, next) => {
  try {
    const currentUserId = req.session.user._id || req.session.user.id;

    // Filter to show ONLY the listings belonging to the authenticated host
    const registeredHomes = await Home.find({ host: currentUserId });

    res.render("host/host-home-list", {
      registeredHomes: registeredHomes,
      pageTitle: "My Hosted Homes",
      currentPage: "host-homes",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    next(err);
  }
};

exports.postAddHome = async (req, res, next) => {
  const { homeName, price, location, rating, description } = req.body;
  const currentUserId = req.session.user._id || req.session.user.id;

  if (!req.file) {
    return res.status(422).render("host/edit-home", {
      pageTitle: "Add Home to airbnb",
      currentPage: "addHome",
      editing: false,
      home: { homeName, price, location, rating, description },
      errors: ["Please provide a valid property photo (JPEG, PNG, or WebP)."],
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  }

  const photo = `/uploads/${req.file.filename}`;

  try {
    const home = new Home({
      homeName: homeName.trim(),
      price: Number(price),
      location: location.trim(),
      rating: Number(rating),
      photo,
      description: description ? description.trim() : "",
      host: currentUserId,
    });

    await home.save();
    res.redirect("/host/host-home-list");
  } catch (error) {
    // Clean up uploaded file if database save fails
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error("Error removing uploaded file on failed save:", unlinkErr);
      }
    }
    next(error);
  }
};

exports.postEditHome = async (req, res, next) => {
  const { homeId, homeName, price, location, rating, description } = req.body;
  const currentUserId = (req.session.user._id || req.session.user.id || "").toString();

  if (!mongoose.Types.ObjectId.isValid(homeId)) {
    if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
    return res.status(404).render("404", {
      pageTitle: "Home Not Found",
      currentPage: "404",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  }

  try {
    const home = await Home.findById(homeId);

    if (!home) {
      if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
      return res.status(404).render("404", {
        pageTitle: "Home Not Found",
        currentPage: "404",
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
      });
    }

    // Verify ownership
    if (!home.host || home.host.toString() !== currentUserId) {
      if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
      return res.status(403).render("403", {
        pageTitle: "Access Denied",
        currentPage: "403",
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
        message: "You are not authorized to edit this listing.",
      });
    }

    const oldPhoto = home.photo;

    home.homeName = homeName.trim();
    home.price = Number(price);
    home.location = location.trim();
    home.rating = Number(rating);
    home.description = description ? description.trim() : "";

    if (req.file) {
      home.photo = `/uploads/${req.file.filename}`;
    }

    await home.save();

    // Only delete the old photo AFTER successful save and only if a new photo was uploaded
    if (req.file && oldPhoto && oldPhoto !== home.photo) {
      safeDeleteFile(oldPhoto);
    }

    res.redirect("/host/host-home-list");
  } catch (error) {
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error("Error removing uploaded file on failed edit:", unlinkErr);
      }
    }
    next(error);
  }
};

exports.postDeleteHome = async (req, res, next) => {
  const homeId = req.params.homeId;
  const currentUserId = (req.session.user._id || req.session.user.id || "").toString();

  if (!mongoose.Types.ObjectId.isValid(homeId)) {
    return res.status(404).render("404", {
      pageTitle: "Home Not Found",
      currentPage: "404",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  }

  try {
    const home = await Home.findById(homeId);

    if (!home) {
      return res.redirect("/host/host-home-list");
    }

    // Verify ownership
    if (!home.host || home.host.toString() !== currentUserId) {
      return res.status(403).render("403", {
        pageTitle: "Access Denied",
        currentPage: "403",
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
        message: "You are not authorized to delete this listing.",
      });
    }

    const photoToDelete = home.photo;

    // Delete listing from database
    await Home.findByIdAndDelete(homeId);

    // Safely remove associated photo from disk
    if (photoToDelete) {
      safeDeleteFile(photoToDelete);
    }

    // Purge references to this deleted home from all users' favourite lists
    await User.updateMany({}, { $pull: { favouriteHomes: homeId } });

    res.redirect("/host/host-home-list");
  } catch (error) {
    next(error);
  }
};