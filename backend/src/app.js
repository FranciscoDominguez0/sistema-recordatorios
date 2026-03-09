import express from "express";
import pool from "./config/database.js";
import authRoutes from "./modules/auth/auth.routes.js";

const app = express();

app.use(express.json());
app.use("/auth", authRoutes);
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

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
