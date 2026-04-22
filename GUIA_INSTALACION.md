# Guía de Instalación del Sistema de Recordatorios

Sigue estos pasos en orden para configurar el proyecto en una nueva PC.

## 1. Requisitos de Software
Antes de empezar, asegúrate de tener instalado lo siguiente:
- **Node.js**: Versión 18 o superior (se recomienda la versión LTS). [Descargar aquí](https://nodejs.org/)
- **MySQL Server**: Recomendado usar **XAMPP** o **WampServer** para una instalación fácil, o MySQL Community Server directamente.
- **Git**: (Opcional) Para clonar el repositorio.

---

## 2. Configuración de la Base de Datos
1. Abre tu gestor de base de datos (phpMyAdmin, MySQL Workbench, etc.).
2. Crea una nueva base de datos llamada `sistema_recordatorios` (o el nombre que prefieras).
3. Importa los archivos SQL en este orden:
   - `database/schema.sql`: Contiene la estructura básica de las tablas.
   - `database/migration_email_layout.sql`: (Si es necesario) Contiene actualizaciones recientes de la estructura.

---

## 3. Configuración del Backend
1. Abre una terminal en la carpeta `backend`.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura las variables de entorno:
   - Crea un archivo llamado `.env` en la raíz de `backend`.
   - Asegúrate de que los datos coincidan con tu MySQL:
     ```env
     PORT=3000
     DB_HOST=localhost
     DB_PORT=3306
     DB_USER=root
     DB_PASSWORD=tu_contraseña
     DB_NAME=sistema_recordatorios
     ```

---

## 4. Configuración del Frontend
1. Abre una terminal en la carpeta `frontend`.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura las variables de entorno:
   - Crea un archivo `.env.local` en la raíz de `frontend`.
   - Define la URL del backend (normalmente el puerto 3000):
     ```env
     NEXT_PUBLIC_API_URL=http://localhost:3000
     ```

---

## 5. Ejecución del Proyecto
Para que el sistema funcione, ambos servidores deben estar corriendo al mismo tiempo:

### Terminal 1 (Backend)
```bash
cd backend
npm start
# O si estás desarrollando:
node src/app.js
```

### Terminal 2 (Frontend)
```bash
cd frontend
npm run dev
```

El sistema estará disponible en [http://localhost:3001](http://localhost:3001).

---

## 6. Solución de Problemas Comunes
- **Error "@theme" en VS Code**: Si ves errores rojos en los archivos CSS, instala la extensión "Tailwind CSS IntelliSense" en VS Code.
- **Error de Conexión DB**: Verifica que el servicio de MySQL esté encendido y que el usuario/contraseña en el `.env` del backend sean correctos.
- **Puerto Ocupado**: Si el puerto 3000 o 3001 ya está en uso, puedes cambiarlos en los archivos `.env`.
