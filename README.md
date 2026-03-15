# Sistema de Recordatorios

Aplicación web para gestionar clientes y servicios con vencimientos, automatizar recordatorios y mantener trazabilidad de acciones y envíos.

Autor: Francisco Dominguez Dominguez  
Contacto: dominguezf041@gmail.com

## Resumen

Este proyecto busca resolver un problema común en operaciones: servicios que se vencen (dominios, hosting, mantenimientos, licencias) y que requieren seguimiento. El sistema centraliza la información, permite administrar el ciclo de vida de cada servicio y habilita recordatorios para reducir omisiones y dar visibilidad al equipo.

## Funcionalidades

- Gestión de clientes.
- Gestión de servicios por cliente (creación, edición, eliminación y renovación).
- Estados de servicio (por ejemplo: activo, vencido, completado) con filtros y vista de agenda por vencimiento.
- Historial y trazabilidad:
  - Logs de actividad.
  - Logs de correos (según configuración del backend).
- Dashboard con métricas/resumen (según endpoints disponibles).

## Arquitectura

- Frontend: Next.js (App Router) ubicado en `frontend/`.
- Backend: Node.js + Express ubicado en `backend/`.
- Base de datos: scripts SQL en `database/`.

### Puertos por defecto (desarrollo)

- Frontend: `http://localhost:3001`
- Backend: `http://127.0.0.1:3000`

El frontend está configurado para consumir la API mediante la ruta `/api/*` y redirigirla al backend.

- Configuración: `frontend/next.config.ts`
- Rewrite: `/api/:path*` -> `http://127.0.0.1:3000/:path*`

## Requisitos

- Node.js (recomendado 20+)
- npm
- Un motor de base de datos compatible con el esquema del proyecto (según configuración del backend)

## Cómo ejecutar en desarrollo

### 1) Backend

Desde `backend/`:

```bash
npm install
npm run dev
```

Si no tienes script `dev`, puedes iniciar con:

```bash
node src/app.js
```

Asegúrate de configurar las variables de entorno del backend (por ejemplo en `backend/.env`).

### 2) Frontend

Desde `frontend/`:

```bash
npm install
npm run dev
```

Abrir:

- `http://localhost:3001`

## Base de datos

En `database/` encontrarás scripts para crear/actualizar el esquema. Referencias típicas:

- `database/schema.sql`
- `database/migration_email_layout.sql`

Importa/ejecuta estos scripts en tu motor de base de datos según el entorno.

## Estructura del repositorio

- `frontend/`: interfaz web (Next.js)
- `backend/`: API (Express)
- `database/`: scripts SQL (schema/migraciones)

## Notas para el equipo

- La autenticación del frontend consume la API con token. En varias llamadas el token se envía como:
  - `Authorization: Bearer <token>`
- Si el frontend abre pero no carga datos:
  - Verifica que el backend esté levantado en `http://127.0.0.1:3000`.
  - Revisa el token en `localStorage` (clave `token`).
  - Inspecciona Network en el navegador para identificar el endpoint que falla.

## Licencia

Uso interno del equipo. Si se requiere una licencia formal, agregar un archivo `LICENSE` en la raíz del repositorio.
