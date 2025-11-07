import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createContainer } from "./infrastructure/config/container";
import { createRouter } from "./infrastructure/http/express/routes/hexagonalRouter";

dotenv.config();

const app = express();

// CORS middleware (allow frontend origin)
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:3000",
  "https://*.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed patterns
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace('*', '.*');
        return new RegExp(`^${pattern}$`).test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// ========== HEXAGONAL ARCHITECTURE ==========
// Create dependency injection container
const container = createContainer();

// Create Express router with injected services
const router = createRouter(
  container.routeService,
  container.complianceService,
  container.bankingService,
  container.poolingService
);

// Mount router
app.use("/", router);

console.log("✅ Hexagonal Architecture initialized");
console.log("✅ HTTP routes mounted");

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`🚀 Backend server listening on http://localhost:${port}`);
  console.log(`📊 API available at http://localhost:${port}/routes`);
});

