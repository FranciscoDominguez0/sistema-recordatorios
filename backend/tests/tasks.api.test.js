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

vi.mock("../src/modules/tasks/tasks.service.js", () => {
  return {
    default: {
      create: vi.fn(),
      getAll: vi.fn(),
      getById: vi.fn(),
      getPending: vi.fn()
    }
  };
});

const loadApp = async () => {
  const mod = await import("../src/appInstance.js");
  return mod.default({ startJobs: false });
};

describe("Tareas (API)", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.JWT_SECRET = "unit-test-secret";
  });

  it("GET /tasks sin token responde 401", async () => {
    const app = await loadApp();
    const res = await request(app).get("/tasks");
    expect(res.status).toBe(401);
    expect(res.body?.message).toBe("Token requerido");
  });

  it("POST /tasks sin token responde 401", async () => {
    const app = await loadApp();
    const res = await request(app).post("/tasks").send({ title: "Nueva" });
    expect(res.status).toBe(401);
    expect(res.body?.message).toBe("Token requerido");
  });

  it("POST /tasks con token responde 201 y devuelve la tarea creada", async () => {
    const tasksService = (await import("../src/modules/tasks/tasks.service.js")).default;

    tasksService.create.mockResolvedValue({
      id: 3,
      title: "Nueva tarea",
      description: null,
      due_date: "2026-12-31",
      is_completed: 0
    });

    const app = await loadApp();
    const token = jwt.sign({ id: 99, email: "admin@test.com", role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Nueva tarea", description: null, due_date: "2026-12-31" });

    expect(res.status).toBe(201);
    expect(res.body?.id).toBe(3);
    expect(res.body?.title).toBe("Nueva tarea");
  });

  it("GET /tasks con token responde 200 y lista tareas", async () => {
    const tasksService = (await import("../src/modules/tasks/tasks.service.js")).default;

    tasksService.getAll.mockResolvedValue([{ id: 1, title: "Tarea 1" }]);

    const app = await loadApp();
    const token = jwt.sign({ id: 99, email: "admin@test.com", role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const res = await request(app).get("/tasks").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.[0]?.title).toBe("Tarea 1");
  });

  it("GET /tasks/pending con token responde 200 y lista tareas pendientes", async () => {
    const tasksService = (await import("../src/modules/tasks/tasks.service.js")).default;

    tasksService.getPending.mockResolvedValue([{ id: 2, title: "Pendiente" }]);

    const app = await loadApp();
    const token = jwt.sign({ id: 99, email: "admin@test.com", role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const res = await request(app).get("/tasks/pending").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.[0]?.id).toBe(2);
  });

  it("GET /tasks/:id cuando no existe responde 404", async () => {
    const tasksService = (await import("../src/modules/tasks/tasks.service.js")).default;
    tasksService.getById.mockResolvedValue(null);

    const app = await loadApp();
    const token = jwt.sign({ id: 99, email: "admin@test.com", role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const res = await request(app).get("/tasks/999").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body?.message).toBe("Tarea no encontrada");
  });
});
