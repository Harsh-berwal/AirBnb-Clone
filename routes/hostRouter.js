// External Module
const express = require("express");
const hostRouter = express.Router();

// Local Modules
const hostController = require("../controllers/hostController");
const upload = require("../middleware/upload");

hostRouter.get("/add-home", hostController.getAddHome);
hostRouter.post("/add-home", upload.single("photo"), hostController.postAddHome);
hostRouter.get("/host-home-list", hostController.getHostHomes);
hostRouter.get("/edit-home/:homeId", hostController.getEditHome);
hostRouter.post("/edit-home", upload.single("photo"), hostController.postEditHome);
hostRouter.post("/delete-home/:homeId", hostController.postDeleteHome);

module.exports = hostRouter;
