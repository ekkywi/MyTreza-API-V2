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
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*", // Allow config via env
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(xss());
app.use(hpp());
app.use(express.json({ limit: "10kb" })); // Body limit
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"));

// Rate Limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit login/register attempts
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply Limiters
app.use("/api/auth", authLimiter);
app.use("/api", globalLimiter);

// mount routes
app.use("/api", routes);

// global error handler
app.use(errorHandler);

// -----------------------------------------------------------
// ⬇️ AUTO SEED CATEGORIES BEFORE SERVER START
// ⬇️ AUTO SEED CATEGORIES BEFORE SERVER START
const initCron = require("./src/infrastructure/scheduler/cron");
const logger = require("./src/infrastructure/logger/logger");

async function initApp() {
  try {
    logger.info("⏳ Initializing MyTreza API...");
    await seedCategories();
    logger.info("✔ Default categories ready.");

    // Start Cron
    initCron();
  } catch (err) {
    logger.error("❌ Failed seeding categories:", err);
  }

  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    logger.info(`🚀 MyTreza API v2 running on http://localhost:${PORT}`);
  });

  // Graceful Shutdown
  const shutdown = async () => {
    logger.info("🛑 SIGTERM/SIGINT received. Shutting down gracefully...");
    server.close(() => {
      logger.info("🔌 HTTP server closed.");
      // Close Prisma connection
      const prisma = require("./src/infrastructure/prismaClient");
      prisma.$disconnect().then(() => {
        logger.info("💾 Database connection closed.");
        process.exit(0);
      });
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

initApp();
// -----------------------------------------------------------
