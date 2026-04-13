# Web-Fichaje

Proyecto de **fichaje/registro horario** con arquitectura separada:

- **Frontend**: React + Vite + Tailwind
- **Backend**: Laravel (API) + Sanctum
- **Base de datos**: MySQL

## Qué contiene este repositorio

- **`frontend/`**: Aplicación React (interfaz, paneles, mapas, gráficas y servicios de API).
- **`backend/`**: API Laravel (rutas, controladores, middleware, modelos, migraciones y seeders).
- **`README.md`**: Guía rápida para instalar y ejecutar.

## Requisitos

- **Node.js** 20+ y npm
- **PHP** 8.2+ y **Composer**
- **MySQL** 8

## Configuración (variables de entorno)

Por seguridad, los `.env` no se suben al repositorio. Debes crear tus ficheros a partir de los ejemplos:

### Backend (Laravel)

```bash
cd backend
cp .env.example .env
php artisan key:generate
```

Edita `backend/.env` con tu configuración MySQL (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`).

### Frontend (Vite)

```bash
cd frontend
cp .env.example .env
```

Edita `frontend/.env` con la URL del backend si aplica (según tus variables definidas en el ejemplo).

## Instalación y arranque en local

### 1) Backend

```bash
cd backend
composer install
php artisan sistema:instalar
php artisan serve --host=127.0.0.1 --port=8000
```

- API: `http://127.0.0.1:8000`

### 2) Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

- App: `http://127.0.0.1:5173`

## Usuario administrador inicial

Creado automáticamente por seeder:

- **Correo**: `admin@presentia.local`
- **Contraseña**: `Admin1234!`
- **Rol**: `administrador`

## Estructura rápida del backend

- **Rutas**: `backend/routes/` (`api.php`, `web.php`, `programador.php`)
- **Controladores**: `backend/app/Http/Controllers/`
- **Middleware**: `backend/app/Http/Middleware/`
- **Migraciones y seeders**: `backend/database/migrations/` y `backend/database/seeders/`

## Producción (resumen)

Flujo típico en VPS:

1. Compilar frontend: `frontend/` → `npm run build` (sirve `frontend/dist` como estático)
2. Backend Laravel:
   - `composer install --no-dev --optimize-autoloader`
   - `cp .env.example .env` + variables reales
   - `php artisan key:generate`
   - `php artisan sistema:instalar`
   - cache: `php artisan config:cache && php artisan route:cache && php artisan view:cache`
3. Nginx:
   - Frontend estático desde `frontend/dist`
   - API apuntando a `backend/public` (por ejemplo bajo `/api`)

## Problemas comunes

- **Laravel 500**:

```bash
cd backend
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

- **Conexión MySQL**: revisa `DB_*` en `backend/.env`
