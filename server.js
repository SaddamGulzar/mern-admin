const mongoose = require("mongoose");

// Ensure Node.js 10+
const [major, minor] = process.versions.node.split(".").map(parseFloat);
if (major < 10 || (major === 10 && minor <= 0)) {
  console.log(
    "Please go to nodejs.org and download version 10 or greater. 👌\n"
  );
  process.exit();
}

// Load environment variables (optional)
require("dotenv").config();

// MongoDB connection
const mongoUrl = process.env.DATABASE || "mongodb://mongo:27017/mydb";

mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});
mongoose.Promise = global.Promise;
mongoose.connection.on("error", (err) => {
  console.error(`🚫 MongoDB connection error → : ${err.message}`);
});

// Load all models
const glob = require("glob");
const path = require("path");
glob.sync("./models/*.js").forEach((file) => require(path.resolve(file)));

// Start the app
const app = require("./app");
const PORT = process.env.PORT || 8192;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Express running → On PORT : ${server.address().port}`);
});
