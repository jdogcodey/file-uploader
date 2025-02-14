const passport = require("passport");
const bcrypt = require("bcryptjs");
const { body, validationResult, check } = require("express-validator");
require("dotenv").config();
const prisma = require("../config/prismaClient");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

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

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = [
    "Bytes",
    "KiB",
    "MiB",
    "GiB",
    "TiB",
    "PiB",
    "EiB",
    "ZiB",
    "YiB",
  ];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

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
  uploadPage: async (req, res, next) => {
    const folders = await prisma.folder.findMany({
      where: { userId: req.user.id },
    });
    res.render("upload", { folders: folders });
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
            sizeBytes: req.file.size,
          },
        });

        res.redirect("/files");
      } catch (error) {
        res.status(500).json({ error: "Error uploading file" });
      }
    },
  ],
  renderFiles: async (req, res, next) => {
    const folders = await prisma.folder.findMany({
      where: { userId: req.user.id },
      include: {
        documents: true,
      },
    });
    const documents = await prisma.document.findMany({
      where: { userId: req.user.id },
      include: {
        folder: true,
      },
    });
    res.render("files", {
      folders: folders,
      documents: documents,
      formatBytes,
    });
  },
  renderAdd: async (req, res, next) => {
    res.render("add-folder");
  },
  addFolder: async (req, res, next) => {
    try {
      const checkForDuplicate = await prisma.folder.findFirst({
        where: {
          userId: req.user.id,
          name: req.body.name,
        },
      });
      if (checkForDuplicate) {
        return res.status(400).json({
          errors: [
            {
              msg: `${req.body.name} is already in use`,
              param: req.body.name,
            },
          ],
        });
      }
      await prisma.folder.create({
        data: {
          name: req.body.name,
          userId: req.user.id,
        },
      });
      res.redirect("/files");
    } catch (err) {
      next(err);
    }
  },
  download: async (req, res, next) => {
    const document = await prisma.document.findFirst({
      where: { savedName: req.params.filename },
    });
    if (!document) {
      return res.status(404);
    } else if (document.userId !== req.user.id) {
      return res.status(401).json({
        errors: [
          {
            msg: "You cannot access documents you did not upload",
          },
        ],
      });
    } else {
      res.download(document.url, (err) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error downloading file");
        }
      });
    }
  },
  deleteFolder: async (req, res, next) => {
    const folderId = parseInt(req.params.folderId);
    const folder = await prisma.folder.findFirst({
      where: { id: folderId },
    });
    if (!folder) {
      return res.status(404);
    } else if (folder.userId !== req.user.id) {
      return res.status(401).json({
        errors: [
          {
            msg: "You do not have the permissions for this action",
          },
        ],
      });
    } else {
      const docsToDelete = await prisma.document.findMany({
        where: {
          userId: req.user.id,
          folderId: folderId,
        },
      });
      docsToDelete.forEach((document) => {
        const pathToFile = path.join(__dirname, "..", document.url);
        fs.unlink(pathToFile, (err) => {
          if (err) {
            console.error("Error deleting the file:", err);
            return res.status(500).json({ error: "Failed to delete file" });
          }
        });
      });
      const deleteDocs = prisma.document.deleteMany({
        where: {
          userId: req.user.id,
          folderId: folderId,
        },
      });
      const deleteFolder = prisma.folder.delete({
        where: { userId: req.user.id, id: folderId },
      });
      await prisma.$transaction([deleteDocs, deleteFolder]);
      res.status(204).end();
    }
  },
  deleteDocument: async (req, res, next) => {
    const documentId = parseInt(req.params.documentId);
    const document = await prisma.document.findFirst({
      where: { id: documentId },
    });
    if (!document) {
      return res.status(404);
    } else if (document.userId !== req.user.id) {
      return res.status(401).json({
        errors: [
          {
            msg: "You do not have the permissions for this action",
          },
        ],
      });
    } else {
      const pathToFile = path.join(__dirname, "..", document.url);
      fs.unlink(pathToFile, (err) => {
        if (err) {
          console.error("Error deleting the file", err);
          return res.status(500).json({ error: "Failed to delete file" });
        }
      });
      const deleteDoc = await prisma.document.delete({
        where: {
          userId: req.user.id,
          id: documentId,
        },
      });
      res.status(204).end();
    }
  },
  editFolder: async (req, res, next) => {
    try {
      const folderId = parseInt(req.params.folderId);

      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          userId: req.user.id,
        },
      });

      if (!folder) {
        return res.status(403).send("Access denied");
      }

      const documents = await prisma.document.findMany({
        where: {
          folderId: folderId,
          userId: req.user.id,
        },
      });

      return res.render("folder", {
        folder: folder,
        documents: documents || [],
      });
    } catch (error) {
      next(error);
    }
  },
  renameFolder: async (req, res, next) => {
    try {
      const folderId = parseInt(req.params.folderId);

      const updateFolder = await prisma.folder.update({
        where: { id: folderId, userId: req.user.id },
        data: { name: req.body.name },
      });
      res.redirect("/files");
    } catch (error) {
      next(error);
    }
  },
};

module.exports = controller;
