import express from "express";
import cors from "cors";
import pool from "./config/database.js";
import routes from "./routes/index.js";
import { startReminderJob } from "./jobs/reminder.job.js";
import { startEmailRetryJob } from "./jobs/emailRetry.job.js";
import { seedDefaultTemplates } from "./config/seedTemplates.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3001", "http://localhost:3000", "http://localhost:3002", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.options(/.*/, cors());

app.use(express.json({ limit: "5mb" }));

startReminderJob();
startEmailRetryJob();
seedDefaultTemplates();
app.use(routes);
app.use("/api", routes);

app.use(errorMiddleware);
app.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() as time");

    res.json({
      message: "Servidor funcionando",
      database_time: rows[0].time
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
