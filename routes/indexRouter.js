const router = require("express").Router();
require("dotenv").config();
const controller = require("../controllers/indexController");
const passport = require("passport");

router.get("/", controller.homepage);

router.post("/sign-up", controller.signUpValidation(), controller.signUp);

router.get("/sign-up", controller.signUpPage);

router.post("/log-in", controller.logIn);

router.get("/log-out", controller.logOut);

router.get("/upload", controller.ensureAuthenticated, controller.uploadPage);

router.post("/upload", controller.ensureAuthenticated, controller.uploadFile);

router.get("/files", controller.ensureAuthenticated, controller.renderFiles);

router.get("/add-folder", controller.ensureAuthenticated, controller.renderAdd);

router.post(
  "/add-folder",
  controller.ensureAuthenticated,
  controller.addFolder
);

router.get(
  "/download/:filename",
  controller.ensureAuthenticated,
  controller.download
);

router.delete(
  "/folder/:folderId",
  controller.ensureAuthenticated,
  controller.deleteFolder
);

router.delete(
  "/document/:documentId",
  controller.ensureAuthenticated,
  controller.deleteDocument
);

router.patch(
  "/rename/:folderId",
  controller.ensureAuthenticated,
  controller.renameFolder
);

router.patch(
  "/edit/:documentId",
  controller.ensureAuthenticated,
  controller.editDocument
);

module.exports = router;
