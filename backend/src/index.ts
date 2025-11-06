import express from "express";
import dotenv from "dotenv";
import routes from "./routes/routes";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/", routes);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});
