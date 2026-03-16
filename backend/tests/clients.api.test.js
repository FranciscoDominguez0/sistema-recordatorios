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

vi.mock("../src/modules/clients/clients.service.js", () => {
  return {
    default: {
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn()
    }
  };
});

const loadApp = async () => {
  const mod = await import("../src/appInstance.js");
  return mod.default({ startJobs: false });
};

describe("Clientes (API)", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.JWT_SECRET = "unit-test-secret";
  });

  it("GET /clients sin token responde 401", async () => {
    const app = await loadApp();
    const res = await request(app).get("/clients");
    expect(res.status).toBe(401);
    expect(res.body?.message).toBe("Token requerido");
  });

  it("GET /clients con token responde 200 y payload paginado", async () => {
    const clientsService = (await import("../src/modules/clients/clients.service.js")).default;

    clientsService.getAll.mockResolvedValue({
      data: [{ id: 1, name: "Cliente 1" }],
      summary: { total_clients: 1 },
      page: 1,
      limit: 10,
      total: 1
    });

    const app = await loadApp();
    const token = jwt.sign({ id: 99, email: "admin@test.com", role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const res = await request(app).get("/clients").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.data?.length).toBe(1);
    expect(res.body?.pagination?.page).toBe(1);
    expect(res.body?.pagination?.total).toBe(1);
  });

  it("POST /clients sin token responde 401", async () => {
    const app = await loadApp();
    const res = await request(app).post("/clients").send({ name: "Cliente Nuevo" });
    expect(res.status).toBe(401);
    expect(res.body?.message).toBe("Token requerido");
  });

  it("POST /clients con token responde 201 y devuelve el cliente creado", async () => {
    const clientsService = (await import("../src/modules/clients/clients.service.js")).default;

    clientsService.create.mockResolvedValue({
      id: 2,
      name: "Cliente Nuevo",
      phone: null,
      email: null,
      notes: null
    });

    const app = await loadApp();
    const token = jwt.sign({ id: 99, email: "admin@test.com", role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const res = await request(app)
      .post("/clients")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Cliente Nuevo", phone: null, email: null, notes: null });

    expect(res.status).toBe(201);
    expect(res.body?.id).toBe(2);
    expect(res.body?.name).toBe("Cliente Nuevo");
  });

  it("GET /clients/:id cuando no existe responde 404", async () => {
    const clientsService = (await import("../src/modules/clients/clients.service.js")).default;
    clientsService.getById.mockResolvedValue(null);

    const app = await loadApp();
    const token = jwt.sign({ id: 99, email: "admin@test.com", role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const res = await request(app).get("/clients/999").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body?.message).toBe("Cliente no encontrado");
  });
});
