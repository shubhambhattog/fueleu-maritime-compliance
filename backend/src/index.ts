import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/routes";

dotenv.config();

const app = express();

// CORS middleware (allow frontend origin)
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());

app.use("/", routes);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});
