const passport = require("passport");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
require("dotenv").config();
const prisma = require("../config/prismaClient");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, uniqueSuffix + fileExtension);
  },
});
const upload = multer({ storage: storage });

const controller = {
  homepage: (req, res, next) => {
    res.render("index", { user: req.user });
  },
  signUpValidation: () => [
    body("first_name")
      .trim()
      .notEmpty()
      .withMessage("First name is required")
      .isAlpha()
      .withMessage("First name must only contain letters"),
    body("last_name")
      .trim()
      .notEmpty()
      .withMessage("Last name is required")
      .isAlpha()
      .withMessage("Last name must only contain letters"),
    body("username").trim().notEmpty().withMessage("Username is required"),
    body("email")
      .trim()
      .isEmail()
      .withMessage("Must be a valid email")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number")
      .matches(/[@$!%*?&]/)
      .withMessage(
        "Password must contain at least one special character (@$!%*?&)"
      )
      .not()
      .isIn(["password", "123456", "qwerty"])
      .withMessage("Password is too common")
      .trim()
      .escape(),
    body("confirm-password").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    }),
  ],
  signUp: async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const checkForDuplicate = await prisma.user.findFirst({
        where: {
          OR: [{ email: req.body.email }, { username: req.body.username }],
        },
      });
      if (checkForDuplicate) {
        let duplicateField;
        if (checkForDuplicate.email === req.body.email) {
          duplicateField = "email";
        } else {
          duplicateField = "username";
        }
        return res.status(400).json({
          errors: [
            {
              msg: `${duplicateField} is already in use`,
              param: duplicateField,
            },
          ],
        });
      }
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      await prisma.user.create({
        data: {
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          username: req.body.username,
          email: req.body.email,
          password: hashedPassword,
        },
      });
      res.redirect("/");
    } catch (err) {
      next(err);
    }
  },
  logIn: passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
    failureMessage: true,
  }),
  logOut: (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  },
  ensureAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/");
  },
  uploadPage: (req, res, next) => {
    res.render("upload");
  },
  uploadFile: [
    upload.single("upload-file"),
    async (req, res) => {
      try {
        const folderName = req.body.folder || "New";

        let folder = await prisma.folder.findFirst({
          where: {
            name: folderName,
            userId: req.user.id,
          },
        });

        if (!folder) {
          folder = await prisma.folder.create({
            data: {
              name: folderName,
              user: { connect: { id: req.user.id } },
            },
          });
        }

        const newDocument = await prisma.document.create({
          data: {
            originalName: req.file.originalname,
            savedName: req.file.filename,
            url: req.file.path,
            userId: req.user.id,
            folderId: folder.id,
          },
        });

        res.redirect("/files");
      } catch (error) {
        res.status(500).json({ error: "Error uploading file" });
      }
    },
  ],
  renderFiles: async (req, res, next) => {
    const files = await prisma.document.findMany({
      where: { userId: req.user.id },
    });
    console.log(files);
  },
};

module.exports = controller;
