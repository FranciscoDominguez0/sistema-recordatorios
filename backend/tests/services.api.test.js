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

vi.mock("../src/modules/reminders/reminder.service.js", () => {
  return {
    default: {
      sendManualServiceEmail: vi.fn()
    }
  };
});

vi.mock("../src/modules/notifications/notifications.service.js", () => {
  return {
    default: {
      broadcastToAdmins: vi.fn().mockResolvedValue(undefined)
    }
  };
});

vi.mock("../src/modules/services/services.service.js", () => {
  return {
    default: {
      getAllWithClient: vi.fn(),
      create: vi.fn(),
      renew: vi.fn()
    }
  };
});

const loadApp = async () => {
  const mod = await import("../src/appInstance.js");
  return mod.default({ startJobs: false });
};

describe("Servicios (API)", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.JWT_SECRET = "unit-test-secret";
  });

  it("POST /services sin token responde 401", async () => {
    const app = await loadApp();
    const res = await request(app).post("/services").send({ client_id: 1, service_name: "Nuevo" });
    expect(res.status).toBe(401);
    expect(res.body?.message).toBe("Token requerido");
  });

  it("POST /services con token responde 201 y devuelve el servicio creado", async () => {
    const servicesService = (await import("../src/modules/services/services.service.js")).default;

    servicesService.create.mockResolvedValue({
      id: 11,
      client_id: 1,
      service_name: "Dominio",
      description: null,
      start_date: "2026-01-01",
      expiration_date: "2027-01-01",
      reminder_days: 30,
      status: "activo"
    });

    const app = await loadApp();
    const token = jwt.sign({ id: 99, email: "admin@test.com", role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const res = await request(app)
      .post("/services")
      .set("Authorization", `Bearer ${token}`)
      .send({
        client_id: 1,
        service_name: "Dominio",
        description: null,
        start_date: "2026-01-01",
        expiration_date: "2027-01-01",
        reminder_days: 30,
        status: "activo"
      });

    expect(res.status).toBe(201);
    expect(res.body?.id).toBe(11);
    expect(res.body?.service_name).toBe("Dominio");
  });

  it("POST /services/:id/renew con token responde 200", async () => {
    const servicesService = (await import("../src/modules/services/services.service.js")).default;

    servicesService.renew.mockResolvedValue({
      id: 11,
      client_id: 1,
      service_name: "Dominio",
      expiration_date: "2027-02-01"
    });

    const app = await loadApp();
    const token = jwt.sign({ id: 99, email: "admin@test.com", role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const res = await request(app)
      .post("/services/11/renew")
      .set("Authorization", `Bearer ${token}`)
      .send({ new_expiration_date: "2027-02-01" });

    expect(res.status).toBe(200);
    expect(res.body?.expiration_date).toBe("2027-02-01");
  });

  it("POST /services/:id/renew cuando no existe responde 404", async () => {
    const servicesService = (await import("../src/modules/services/services.service.js")).default;
    servicesService.renew.mockResolvedValue(null);

    const app = await loadApp();
    const token = jwt.sign({ id: 99, email: "admin@test.com", role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const res = await request(app)
      .post("/services/999/renew")
      .set("Authorization", `Bearer ${token}`)
      .send({ new_expiration_date: "2027-02-01" });

    expect(res.status).toBe(404);
    expect(res.body?.message).toBe("Servicio no encontrado");
  });

  it("POST /services/:id/send-manual-email con id inválido responde 400", async () => {
    const app = await loadApp();
    const token = jwt.sign({ id: 99, email: "admin@test.com", role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const res = await request(app)
      .post("/services/0/send-manual-email")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body?.message).toBe("ID de servicio inválido");
  });

  it("POST /services/:id/send-manual-email con token responde 200", async () => {
    const reminderService = (await import("../src/modules/reminders/reminder.service.js")).default;
    reminderService.sendManualServiceEmail.mockResolvedValue({
      message: "Correo enviado",
      service_id: 11,
      email: "c1@test.com",
      subject: "Recordatorio"
    });

    const app = await loadApp();
    const token = jwt.sign({ id: 99, email: "admin@test.com", role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const res = await request(app)
      .post("/services/11/send-manual-email")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body?.message).toBe("Correo enviado");
    expect(res.body?.service_id).toBe(11);
  });

  it("POST /services/:id/send-manual-email si falla responde 500", async () => {
    const reminderService = (await import("../src/modules/reminders/reminder.service.js")).default;
    reminderService.sendManualServiceEmail.mockRejectedValue(new Error("No se pudo enviar"));

    const app = await loadApp();
    const token = jwt.sign({ id: 99, email: "admin@test.com", role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const res = await request(app)
      .post("/services/11/send-manual-email")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(500);
    expect(res.body?.message).toBe("No se pudo enviar");
  });

  it("GET /services con token responde 200 y payload paginado", async () => {
    const servicesService = (await import("../src/modules/services/services.service.js")).default;

    servicesService.getAllWithClient.mockResolvedValue({
      data: [
        {
          id: 10,
          client_id: 1,
          service_name: "Hosting",
          client_name: "Cliente 1",
          client_email: "c1@test.com"
        }
      ],
      summary: { total_services: 1 },
      page: 1,
      limit: 10,
      total: 1
    });

    const app = await loadApp();
    const token = jwt.sign({ id: 99, email: "admin@test.com", role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const res = await request(app).get("/services").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.data?.[0]?.service_name).toBe("Hosting");
    expect(res.body?.pagination?.total).toBe(1);
  });
});
