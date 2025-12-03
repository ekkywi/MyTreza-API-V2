require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const xss = require("xss-clean");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");

const routes = require("./src/presentation/routes");
const {
  errorHandler,
} = require("./src/presentation/middleware/error.middleware");

// ⬇️ IMPORT SEED
const seedCategories = require("./src/infrastructure/seed/seedCategories");

const app = express();

app.use(helmet());
app.use(cors());
app.use(xss());
app.use(hpp());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"));

// basic rate limiter
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

// mount routes
app.use("/api", routes);

// global error handler
app.use(errorHandler);

// -----------------------------------------------------------
// ⬇️ AUTO SEED CATEGORIES BEFORE SERVER START
async function initApp() {
  try {
    console.log("⏳ Initializing MyTreza API...");
    await seedCategories();
    console.log("✔ Default categories ready.");
  } catch (err) {
    console.error("❌ Failed seeding categories:", err);
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`MyTreza API v2 running on http://localhost:${PORT}`);
  });
}

initApp();
// -----------------------------------------------------------
