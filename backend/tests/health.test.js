import { describe, it, expect } from "vitest";
import request from "supertest";
import createApp from "../src/appInstance.js";

describe("Healthcheck", () => {
  it("GET /health responde 200 y ok=true", async () => {
    const app = createApp({ startJobs: false });
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
