import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

/**
 * Middleware de autenticación JWT.
 *
 * - Espera header: Authorization: Bearer <TOKEN>
 * - Si es válido, setea req.user con el payload del JWT
 * - Si falta token: 401 Token requerido
 * - Si token inválido: 401 Token inválido
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export function verifyToken(req, res, next) {
  const authHeader = req.headers?.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token requerido" });
  }

  const [scheme, token] = authHeader.split(" ");
  const isBearer = scheme?.toLowerCase() === "bearer";

  if (!isBearer || !token) {
    return res.status(401).json({ message: "Token requerido" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: "JWT_SECRET no configurado" });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
}
