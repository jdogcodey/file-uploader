const router = require("express").Router();
const passport = require("passport");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const controller = require("../controllers/indexController");

const prisma = new PrismaClient();

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

module.exports = router;
