const path = require("node:path");
const express = require("express");
const expressSession = require("express-session");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } = require("@prisma/client");
const passport = require("passport");
require("dotenv").config();
const routes = require("./routes/indexRouter");
const PORT = process.env.PORT;
require("./config/passport");
const methodOverride = require("method-override");

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use((req, res, next) => {
  console.log(`Before method-override: ${req.method}`);
  next();
});

app.use(methodOverride("_method"));

app.use((req, res, next) => {
  console.log(`After method-override: ${req.method}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  expressSession({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    store: new PrismaSessionStore(new PrismaClient(), {
      checkPeriod: 2 * 60 * 1000,
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(routes);

// Catch all unknown routes
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error for debugging
  res
    .status(500)
    .json({ error: "Something went wrong, please try again later" });
});

app.listen(PORT, () => console.log(`app listening on port: ${PORT}`));
