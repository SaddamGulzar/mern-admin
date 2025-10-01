const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
const bodyParser = require("body-parser");
const promisify = require("es6-promisify");

const apiRouter = require("./routes/api");
const authApiRouter = require("./routes/authApi");

const errorHandlers = require("./handlers/errorHandlers");
const { isValidToken } = require("./controllers/authController");

require("dotenv").config(); // optional, fallback works if missing

// create Express app
const app = express();

// serve static files from public/
app.use(express.static(path.join(__dirname, "public")));

// parse request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Fallback env variables
const mongoUrl = process.env.DATABASE || "mongodb://mongo:27017/mydb";
const sessionSecret = process.env.SECRET || "defaultSecret";
const sessionKey = process.env.KEY || "defaultKey";

// Session setup
app.use(
  session({
    secret: sessionSecret,
    key: sessionKey,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl }),
  })
);

// Test route to verify server is running
app.get("/test", (req, res) => res.send("App is running!"));

// Pass variables to templates + requests
app.use((req, res, next) => {
  res.locals.admin = req.admin || null;
  res.locals.currentPath = req.path;
  next();
});

// Promisify callback APIs
app.use((req, res, next) => {
  req.login = promisify(req.login, req);
  next();
});

// CORS headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,PATCH,PUT,POST,DELETE");
  res.header("Access-Control-Expose-Headers", "Content-Length");
  res.header(
    "Access-Control-Allow-Headers",
    "Accept, Authorization, x-auth-token, Content-Type, X-Requested-With, Range"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Dynamic API endpoint listing
function listRoutes(router, basePath = "") {
  const routes = [];
  router.stack.forEach((r) => {
    if (r.route && r.route.path) {
      const methods = Object.keys(r.route.methods).join(",").toUpperCase();
      routes.push(`${methods} ${basePath}${r.route.path}`);
    }
  });
  return routes;
}

app.get("/api", (req, res) => {
  const apiRoutes = [
    ...listRoutes(authApiRouter, "/api"),
    ...listRoutes(apiRouter, "/api"),
  ];
  res.json({ message: "Available API endpoints", endpoints: apiRoutes });
});

// Register routers
app.use("/api", authApiRouter);
app.use("/api", apiRouter);

// Optional: protect api routes with token
// app.use("/api", isValidToken, apiRouter);

// 404 handler
app.use(errorHandlers.notFound);

// Development error handler
if (app.get("env") === "development") {
  app.use(errorHandlers.developmentErrors);
}

// Production error handler
app.use(errorHandlers.productionErrors);

module.exports = app;

