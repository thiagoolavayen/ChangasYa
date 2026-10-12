# ChangasYa

Aplicación de servicios con **backend Node.js/Express + PostgreSQL + Socket.IO** y **app móvil Expo/React Native**.

## Requisitos

- Node.js y npm instalados.
- PostgreSQL instalado y en ejecución.
- Expo Go en el teléfono (si la versión de Expo es compatible) o un emulador Android/iOS.

## 1. Backend

```bash
cd backend
npm install
```

Crear `.env` desde `.env.example` y editar `DATABASE_URL` y `JWT_SECRET`:

```bash
cp .env.example .env
```

En Windows PowerShell: `Copy-Item .env.example .env`.

Crear la base de datos `changasya` en PostgreSQL, luego ejecutar el esquema (requiere `psql`):

```bash
psql "$DATABASE_URL" -f src/db/schema.sql
```

Si la variable no está exportada, usar: `psql -U postgres -d changasya -f src/db/schema.sql`.

Iniciar:

```bash
npm run dev
```

Probar `http://localhost:4000/health` (debe devolver `ok: true`).

Firebase es opcional para el inicio, pero las notificaciones push requieren credenciales válidas; **nunca** publicar el JSON de la cuenta de servicio.

## 2. App móvil

Abrir otra terminal:

```bash
cd mobile
npm install
```

Copiar `mobile/.env.example` a `mobile/.env` y reemplazar la dirección por la IP local de la computadora que ejecuta el backend. Ejemplo:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:4000/api
```

La PC y el celular deben estar en la misma red Wi-Fi. `localhost` solo funciona si el backend corre en el mismo dispositivo o hay redirección configurada. Si se modifica el `.env`, reiniciar Expo.

```bash
npm start
```

Escanear el QR o abrir un emulador. La experiencia puede requerir un build de desarrollo según la versión de Expo y los módulos instalados.

## Estructura

- `backend/src`: API, autenticación, servicios, rutas y sockets.
- `backend/src/db/schema.sql`: esquema SQL.
- `mobile/App.js`: entrada de la app.
- `mobile/src`: pantallas, navegación, contexto y cliente de API.

## Editar y publicar

Abrir la carpeta `ChangasYa` en VS Code. El backend usa `npm run dev` para recarga por cambios; Expo recarga la app durante desarrollo. Para publicar desde una terminal con Git instalado:

```bash
git init
git add .
git commit -m "Initial commit: ChangasYa backend y mobile"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/ChangasYa.git
git push -u origin main
```

Crear primero el repositorio público vacío llamado `ChangasYa` en GitHub, **sin** inicializar README ni `.gitignore` (ambos ya vienen incluidos).

## Seguridad y estado

No se incluyen carpetas `node_modules`, cachés de Expo, ni el `.env` original. Antes de usar en producción revisar autenticación, CORS, manejo de datos personales, permisos y secretos. El proyecto está preparado para desarrollo, pero no está certificado como listo para producción ni se verificó su ejecución de extremo a extremo.
