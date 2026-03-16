import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/modules/activity_logs/activityLogs.service.js", () => {
  return {
    default: {
      logActivity: vi.fn().mockResolvedValue(undefined)
    }
  };
});

vi.mock("../src/modules/auth/auth.repository.js", () => {
  return {
    default: {
      findUserByEmail: vi.fn(),
      incrementFailedLoginAttempt: vi.fn().mockResolvedValue({ failed_login_attempts: 1, is_active: 1 }),
      resetFailedLoginAttempts: vi.fn().mockResolvedValue(undefined),
      deactivateUser: vi.fn().mockResolvedValue(undefined)
    }
  };
});

vi.mock("bcrypt", () => {
  return {
    default: {
      compare: vi.fn()
    }
  };
});

vi.mock("jsonwebtoken", () => {
  return {
    default: {
      sign: vi.fn(() => "test-token")
    }
  };
});

const loadApp = async () => {
  const mod = await import("../src/appInstance.js");
  return mod.default({ startJobs: false });
};

describe("Auth - login", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.JWT_SECRET = "unit-test-secret";
  });

  it("POST /auth/login responde 200 y devuelve token + user cuando credenciales son correctas", async () => {
    const authRepository = (await import("../src/modules/auth/auth.repository.js")).default;
    const bcrypt = (await import("bcrypt")).default;

    authRepository.findUserByEmail.mockResolvedValue({
      id: 1,
      name: "Test User",
      email: "test@example.com",
      password_hash: "hashed",
      role: "admin",
      avatar_url: null,
      is_active: 1,
      failed_login_attempts: 0
    });

    bcrypt.compare.mockResolvedValue(true);

    const app = await loadApp();
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@example.com", password: "123456" });

    expect(res.status).toBe(200);
    expect(res.body?.token).toBe("test-token");
    expect(res.body?.user).toEqual({
      id: 1,
      name: "Test User",
      email: "test@example.com",
      avatar_url: null
    });
  });

  it("POST /auth/login con password incorrecto responde 401", async () => {
    const authRepository = (await import("../src/modules/auth/auth.repository.js")).default;
    const bcrypt = (await import("bcrypt")).default;

    authRepository.findUserByEmail.mockResolvedValue({
      id: 1,
      name: "Test User",
      email: "test@example.com",
      password_hash: "hashed",
      role: "admin",
      avatar_url: null,
      is_active: 1,
      failed_login_attempts: 0
    });

    bcrypt.compare.mockResolvedValue(false);

    const app = await loadApp();
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@example.com", password: "wrong" });

    expect(res.status).toBe(401);
    expect(res.body?.message).toBe("Credenciales incorrectas");
  });

  it("POST /auth/login sin email/password responde 401", async () => {
    const app = await loadApp();
    const res = await request(app).post("/auth/login").send({});

    expect(res.status).toBe(401);
    expect(res.body?.message).toBe("Credenciales incorrectas");
  });
});
