

export function errorMiddleware(err, req, res, next) {
  if (!err) return next();

  const status = Number(err.statusCode ?? err.status ?? 500);
  const safeStatus = Number.isFinite(status) && status >= 400 ? status : 500;

  const message = typeof err.message === "string" && err.message.trim()
    ? err.message
    : "Error interno del servidor";

  if (safeStatus >= 500) {
    console.error(err);
  }

  return res.status(safeStatus).json({ message });
}

