import express, { Express } from "express";
import router from "./routes/index.ts";
import cors from "cors";
import { PORT } from "./utils/settings.ts";

const app: Express = express();
app.get("/", (req, res) => {
  res.send("Server Started!");
});
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cors());
app.use(router);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
