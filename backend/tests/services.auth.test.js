import { describe, it, expect } from "vitest";
import request from "supertest";
import createApp from "../src/appInstance.js";

describe("Servicios (auth)", () => {
  it("GET /services sin token responde 401", async () => {
    const app = createApp({ startJobs: false });
    const res = await request(app).get("/services");
    expect(res.status).toBe(401);
    expect(res.body?.message).toBe("Token requerido");
  });

  it("GET /api/services sin token responde 401", async () => {
    const app = createApp({ startJobs: false });
    const res = await request(app).get("/api/services");
    expect(res.status).toBe(401);
    expect(res.body?.message).toBe("Token requerido");
  });
});
