import bcrypt from "bcrypt";
import usersRepository from "./users.repository.js";

class UsersService {
  async getAll({ page, limit, search } = {}) {
    return usersRepository.getAll({ page, limit, search });
  }

  async getById(id) {
    const numericId = Number.parseInt(String(id), 10);
    if (!Number.isFinite(numericId) || numericId <= 0) return null;
    return usersRepository.findById(numericId);
  }

  async create({ name, email, password, role, is_active, receive_notifications } = {}) {
    const normalizedName  = typeof name  === "string" ? name.trim()  : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedRole  = typeof role  === "string" ? role.trim().toLowerCase()  : "staff";

    if (!normalizedName)  { const e = new Error("Nombre requerido");  e.statusCode = 400; throw e; }
    if (!normalizedEmail) { const e = new Error("Email requerido");   e.statusCode = 400; throw e; }
    if (!password || String(password).length < 8) { const e = new Error("La contraseña debe tener mínimo 8 caracteres"); e.statusCode = 400; throw e; }

    const allowedRoles = new Set(["admin", "staff"]);
    const finalRole = allowedRoles.has(normalizedRole) ? normalizedRole : "staff";

    const existing = await usersRepository.findByEmail(normalizedEmail);
    if (existing) { const e = new Error("El email ya está registrado"); e.statusCode = 409; throw e; }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const active = typeof is_active === "boolean" ? is_active : true;
    const notif  = typeof receive_notifications === "boolean" ? receive_notifications : true;

    return usersRepository.create({
      name: normalizedName,
      email: normalizedEmail,
      password_hash: passwordHash,
      role: finalRole,
      is_active: active,
      receive_notifications: notif
    });
  }

  async update(id, { name, email, password, role, is_active, receive_notifications } = {}) {
    const numericId = Number.parseInt(String(id), 10);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      const error = new Error("ID inválido");
      error.statusCode = 400;
      throw error;
    }

    const existing = await usersRepository.findById(numericId);
    if (!existing) {
      const error = new Error("Usuario no encontrado");
      error.statusCode = 404;
      throw error;
    }

    const patch = {};

    if (typeof name === "string") {
      const normalizedName = name.trim();
      if (!normalizedName) {
        const error = new Error("Nombre requerido");
        error.statusCode = 400;
        throw error;
      }
      patch.name = normalizedName;
    }

    if (typeof email === "string") {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        const error = new Error("Email requerido");
        error.statusCode = 400;
        throw error;
      }

      const emailOwner = await usersRepository.findByEmail(normalizedEmail);
      if (emailOwner && Number(emailOwner.id) !== numericId) {
        const error = new Error("El email ya está registrado");
        error.statusCode = 409;
        throw error;
      }

      patch.email = normalizedEmail;
    }

    if (password !== undefined) {
      if (!password || String(password).length < 8) {
        const error = new Error("La contraseña debe tener mínimo 8 caracteres");
        error.statusCode = 400;
        throw error;
      }

      patch.password_hash = await bcrypt.hash(String(password), 10);
    }

    if (typeof role === "string") {
      const normalizedRole = role.trim().toLowerCase();
      const allowedRoles = new Set(["admin", "staff"]);
      patch.role = allowedRoles.has(normalizedRole) ? normalizedRole : "staff";
    }

    if (typeof is_active === "boolean") patch.is_active = is_active;
    if (typeof receive_notifications === "boolean") patch.receive_notifications = receive_notifications;

    if (Object.keys(patch).length === 0) {
      const error = new Error("No hay campos para actualizar");
      error.statusCode = 400;
      throw error;
    }

    await usersRepository.updateById(numericId, patch);
    return usersRepository.findById(numericId);
  }

  async remove(id) {
    const numericId = Number.parseInt(String(id), 10);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      const error = new Error("ID inválido");
      error.statusCode = 400;
      throw error;
    }

    const ok = await usersRepository.deleteById(numericId);
    if (!ok) {
      const error = new Error("Usuario no encontrado");
      error.statusCode = 404;
      throw error;
    }
  }
  async updateAvatar(id, avatarBase64) {
    const numericId = Number.parseInt(String(id), 10);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      const error = new Error("ID inválido");
      error.statusCode = 400;
      throw error;
    }

    const existing = await usersRepository.findById(numericId);
    if (!existing) {
      const error = new Error("Usuario no encontrado");
      error.statusCode = 404;
      throw error;
    }

    const avatar = typeof avatarBase64 === "string" && avatarBase64.trim() ? avatarBase64.trim() : null;

    await usersRepository.updateById(numericId, { avatar_url: avatar });
    return usersRepository.findById(numericId);
  }
}

export default new UsersService();
