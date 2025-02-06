const router = require("express").Router();
require("dotenv").config();
const controller = require("../controllers/indexController");
const passport = require("passport");

router.get("/", controller.homepage);

router.post("/sign-up", controller.signUpValidation(), controller.signUp);

router.post("/log-in", controller.logIn);

router.get("/log-out", controller.logOut);

router.get("/upload", controller.ensureAuthenticated, controller.uploadPage);

router.post("/upload", controller.ensureAuthenticated, controller.uploadFile);

router.get("/files", controller.ensureAuthenticated, controller.renderFiles);

module.exports = router;
