const express = require("express");
const Home = require("../models/home");
const fs = require("fs");   


exports.getAddHome = (req, res, next) => {
  res.render("host/edit-home", {
    pageTitle: "Add Home to airbnb",
    currentPage: "addHome",
    editing: false,
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};

exports.getEditHome = (req, res, next) => {
  const homeId = req.params.homeId;
  const editing = req.query.editing === "true";

  Home.findById(homeId).then(home => {
    if (!home) {
      return res.redirect("/host/host-home-list");
    } else {
      res.render("host/edit-home", {
        pageTitle: "Edit Home",
        currentPage: "host-homes",
        editing: editing,
        home: home,
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
      });
    }
  });
};

exports.getHostHomes = (req, res, next) => {
  Home.find()
    .then((registeredHomes) => {
      res.render("host/host-home-list", {
        registeredHomes: registeredHomes,
        pageTitle: "My Hosted Homes",
        currentPage: "host-homes",
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
      });
    })
    .catch((err) => {
      console.error("Error fetching homes: ", err);
    });
};

exports.postAddHome = (req, res, next) => {
  const { homeName, price, location, rating, description } = req.body;

  if(!req.file) {
    return res.redirect("/host/host-home-list");
  }
  const photo = req.file ? `/uploads/${req.file.filename}` : null;
  const home = new Home({homeName, price, location, rating, photo, description});

  home.save() 
    .then(() => res.redirect("/host/host-home-list"))
    .catch((error) => {
      console.error("Error saving home:", error);
      res.redirect("/host/host-home-list");
    });
};


exports.postEditHome = (req, res, next) => {
  const { homeId, homeName, price, location, rating, description } = req.body;
  Home.findById(homeId).then((home) => {
    if (!home) {
      return res.redirect("/host/host-home-list");
    } 
    home.homeName = homeName;
    home.price = price;
    home.location = location; 
    home.rating = rating;
    home.description = description;

    if(req.file) {
      fs.unlink(`uploads/${home.photo.split('/uploads/')[1]}`,
       (err) => {
        if (err) {
          console.error("Error deleting old photo:", err);
        }
      });
      home.photo = `/uploads/${req.file.filename}`;
    }

    home.save()
    .then(() => res.redirect("/host/host-home-list"))
    .catch((error) => {
      console.error("Error updating home:", error);
      res.redirect("/host/host-home-list");
    });
  }).catch((error) => {
    console.error("Error finding home:", error);
    res.redirect("/host/host-home-list");
  });
};

exports.postDeleteHome = (req, res, next) => {
  const homeId = req.params.homeId;

  Home.findByIdAndDelete(homeId).then(() => {
    res.redirect("/host/host-home-list");
  }).catch((error) => {
    console.log("Error deleting home:", error);
    res.redirect("/host/host-home-list");
  });
};