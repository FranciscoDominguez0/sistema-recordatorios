import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("../src/modules/activity_logs/activityLogs.service.js", () => {
  return {
    default: {
      logActivity: vi.fn().mockResolvedValue(undefined)
    }
  };
});

vi.mock("../src/modules/users/users.service.js", () => {
  return {
    default: {
      getAll: vi.fn(),
      create: vi.fn(),
      remove: vi.fn().mockResolvedValue(undefined),
      getById: vi.fn().mockResolvedValue(null)
    }
  };
});

const loadApp = async () => {
  const mod = await import("../src/appInstance.js");
  return mod.default({ startJobs: false });
};

describe("Usuarios (API)", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.JWT_SECRET = "unit-test-secret";
  });

  it("GET /users sin token responde 401", async () => {
    const app = await loadApp();
    const res = await request(app).get("/users");
    expect(res.status).toBe(401);
    expect(res.body?.message).toBe("Token requerido");
  });

  it("GET /users con token responde 200 y devuelve array (sin paginación)", async () => {
    const usersService = (await import("../src/modules/users/users.service.js")).default;

    usersService.getAll.mockResolvedValue({
      data: [{ id: 1, name: "Admin", email: "admin@test.com" }],
      summary: { total_users: 1 },
      page: 1,
      limit: 10,
      total: 1
    });

    const app = await loadApp();
    const token = jwt.sign({ id: 99, email: "admin@test.com", role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const res = await request(app).get("/users").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body?.[0]?.email).toBe("admin@test.com");
  });

  it("POST /users sin token responde 401", async () => {
    const app = await loadApp();
    const res = await request(app).post("/users").send({ name: "Nuevo", email: "n@t.com", password: "123" });
    expect(res.status).toBe(401);
    expect(res.body?.message).toBe("Token requerido");
  });

  it("POST /users con token responde 201 y devuelve el usuario creado", async () => {
    const usersService = (await import("../src/modules/users/users.service.js")).default;

    usersService.create.mockResolvedValue({
      id: 2,
      name: "Nuevo Usuario",
      email: "nuevo@test.com",
      role: "user",
      is_active: 1
    });

    const app = await loadApp();
    const token = jwt.sign({ id: 99, email: "admin@test.com", role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const res = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Nuevo Usuario", email: "nuevo@test.com", password: "123456", role: "user", is_active: 1 });

    expect(res.status).toBe(201);
    expect(res.body?.id).toBe(2);
    expect(res.body?.email).toBe("nuevo@test.com");
  });

  it("DELETE /users/:id con token responde 204", async () => {
    const usersService = (await import("../src/modules/users/users.service.js")).default;
    usersService.remove.mockResolvedValue(undefined);

    const app = await loadApp();
    const token = jwt.sign({ id: 99, email: "admin@test.com", role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const res = await request(app).delete("/users/2").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});
