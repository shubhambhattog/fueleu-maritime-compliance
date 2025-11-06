import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// CORS middleware (allow frontend origin)
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());

// Use database-backed routes if DATABASE_URL is configured, otherwise use in-memory
const useDatabase = !!process.env.DATABASE_URL;
console.log(`🔌 Using ${useDatabase ? 'DATABASE (Neon Postgres)' : 'IN-MEMORY'} storage`);

if (useDatabase) {
  import("./routes/routes-db").then(module => {
    app.use("/", module.default);
    console.log("✅ Database routes loaded");
  }).catch(err => {
    console.error("❌ Failed to load database routes:", err);
    console.log("🔄 Falling back to in-memory routes");
    import("./routes/routes").then(module => {
      app.use("/", module.default);
    });
  });
} else {
  import("./routes/routes").then(module => {
    app.use("/", module.default);
    console.log("✅ In-memory routes loaded");
  });
}

const port = process.env.PORT || 4000;

// Delay server start to allow routes to load
setTimeout(() => {
  app.listen(port, () => {
    console.log(`🚀 Backend server listening on http://localhost:${port}`);
  });
}, 1000);
