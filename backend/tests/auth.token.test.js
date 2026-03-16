import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import { verifyToken } from "../src/middlewares/auth.middleware.js";

describe("Auth - verifyToken (ruta protegida)", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "unit-test-secret";
  });

  it("con Bearer token válido responde 200 y expone req.user", async () => {
    const app = express();
    app.get("/protected", verifyToken, (req, res) => res.json({ user: req.user }));

    const token = jwt.sign({ id: 10, email: "a@a.com", role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.user?.id).toBe(10);
    expect(res.body?.user?.email).toBe("a@a.com");
    expect(res.body?.user?.role).toBe("admin");
  });

  it("con token inválido responde 401", async () => {
    const app = express();
    app.get("/protected", verifyToken, (req, res) => res.json({ user: req.user }));

    const res = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer invalid.token.value");

    expect(res.status).toBe(401);
    expect(res.body?.message).toBe("Token inválido");
  });
});
