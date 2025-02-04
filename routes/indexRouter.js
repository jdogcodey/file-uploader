const router = require("express").Router();
require("dotenv").config();
const controller = require("../controllers/indexController");
const passport = require("passport");

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

router.get("/", (req, res, next) => {
  res.render("index", { user: req.user });
});

router.post("/sign-up", controller.signUpValidation(), controller.signUp);

router.post("/log-in", controller.logIn);

router.get("/log-out", controller.logOut);

module.exports = router;
