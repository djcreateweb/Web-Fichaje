# Migracion de App de Fichaje a Laravel + MySQL + VPS

Este documento describe todos los pasos en orden estricto para migrar y ejecutar la aplicacion con arquitectura completa:

- Frontend: React 19 + Vite + Tailwind CSS 4
- Backend: Laravel 11 + PHP 8.2+
- Base de datos: MySQL 8
- Autenticacion: Laravel Sanctum
- Produccion: VPS Linux + Nginx + SSL Let's Encrypt

Si sigues este README de principio a fin, el proyecto arranca sin errores y sin pasos adicionales.

---

## 1) Requisitos previos

1. Instala Node.js 20 LTS o superior.
   - Verifica con: `node -v`
   - Debe mostrar una version valida (por ejemplo `v20.x.x`).
2. Instala npm (normalmente viene con Node.js).
   - Verifica con: `npm -v`
3. Instala PHP 8.2+ con extensiones necesarias (`mbstring`, `openssl`, `pdo_mysql`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`, `fileinfo`).
   - Verifica con: `php -v`
4. Instala Composer.
   - Verifica con: `composer -V`
5. Instala MySQL 8 en `localhost`.
   - Verifica con: `mysql --version`

---

## 2) Instalacion en local

1. Desde la raiz del proyecto, crea la nueva estructura:
   ```bash
   mkdir frontend
   mkdir backend
   ```
   - Confirmacion: existen carpetas `frontend/` y `backend/`.
2. Mueve la app React actual al frontend (segun el estado del repositorio).
3. Instala dependencias del frontend:
   ```bash
   cd frontend
   npm install
   cd ..
   ```
   - Confirmacion: existe `frontend/node_modules`.
4. Crea proyecto Laravel en backend:
   ```bash
   cd backend
   composer create-project laravel/laravel .
   cd ..
   ```
   - Confirmacion: existe `backend/artisan`.
5. Instala Sanctum en backend:
   ```bash
   cd backend
   composer require laravel/sanctum
   php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
   php artisan migrate
   cd ..
   ```
   - Confirmacion: tablas de Sanctum creadas.

---

## 3) Configuracion automatica de base de datos

Este proyecto define un comando de instalacion para que todo se haga sin pasos manuales.

1. Ejecuta:
   ```bash
   cd backend
   php artisan sistema:instalar
   cd ..
   ```
2. Este comando debe:
   - Crear base de datos local si no existe.
   - Configurar `.env` para `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_DATABASE=fichaje`, `DB_USERNAME=root`, `DB_PASSWORD=`.
   - Ejecutar `php artisan migrate --force`.
   - Ejecutar `php artisan db:seed --force`.
3. Confirmacion esperada:
   - Migraciones completadas.
   - Seeders completados.
   - Si la base existe, el proceso continua sin errores.

---

## 4) Usuario administrador inicial

Creado automaticamente por seeder:

- Correo: `admin@presentia.local`
- Contrasena: `Admin1234!`
- Rol: `administrador`

Se recomienda cambiar la contrasena en el primer acceso.

---

## 5) Arranque del proyecto en local

1. Inicia backend:
   ```bash
   cd backend
   php artisan serve --host=127.0.0.1 --port=8000
   ```
   - Confirmacion: API en `http://127.0.0.1:8000`.
2. En otra terminal inicia frontend:
   ```bash
   cd frontend
   npm run dev
   ```
   - Confirmacion: app en `http://127.0.0.1:5173`.
3. Prueba de acceso:
   - Inicia sesion con el administrador por defecto.
   - Debes acceder al panel sin errores.

---

## 6) Despliegue en VPS Linux

1. Actualiza sistema:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
2. Instala servicios:
   ```bash
   sudo apt install -y nginx mysql-server php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-xml php8.2-bcmath php8.2-curl php8.2-zip unzip git composer
   ```
3. Clona proyecto:
   ```bash
   git clone <URL_REPOSITORIO> fichaje
   cd fichaje
   ```
4. Compila frontend:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```
5. Prepara backend:
   ```bash
   cd backend
   composer install --no-dev --optimize-autoloader
   cp .env.example .env
   php artisan key:generate
   php artisan sistema:instalar
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   cd ..
   ```
6. Ajusta permisos:
   ```bash
   sudo chown -R www-data:www-data backend/storage backend/bootstrap/cache
   sudo chmod -R 775 backend/storage backend/bootstrap/cache
   ```
7. Configura Nginx:
   - Frontend estatico desde `frontend/dist`.
   - Backend API por `/api` apuntando a `backend/public`.
8. Verifica Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```
   - Confirmacion: `nginx -t` devuelve OK.

---

## 7) Dominio y SSL

1. Instala Certbot:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```
2. Emite certificados:
   ```bash
   sudo certbot --nginx -d midominio.com -d www.midominio.com
   ```
3. Verifica renovacion:
   ```bash
   sudo certbot renew --dry-run
   ```
   - Confirmacion: renovacion de prueba correcta.

---

## 8) Problemas comunes

1. Error 500 en Laravel:
   ```bash
   cd backend
   php artisan config:clear
   php artisan cache:clear
   php artisan route:clear
   ```
2. Falla conexion MySQL:
   - Revisa variables `DB_*` en `backend/.env`.
   - Verifica servicio: `sudo systemctl status mysql`.
3. CORS bloqueado:
   - Revisa `config/cors.php` y dominio permitido.
4. Frontend no carga tras deploy:
   - Recompila `npm run build` y valida raiz Nginx.
5. Permisos Laravel:
   ```bash
   sudo chown -R www-data:www-data backend/storage backend/bootstrap/cache
   sudo chmod -R 775 backend/storage backend/bootstrap/cache
   ```

---

## 9) Comando unico de primera instalacion

Para automatizar base de datos y arranque backend:

```bash
cd backend && php artisan sistema:instalar && php artisan serve --host=127.0.0.1 --port=8000
```

En otra terminal:

```bash
cd frontend && npm run dev
```

Resultado esperado final:
- Backend y frontend corriendo.
- Base de datos lista con migraciones y seeders.
- Usuario admin disponible para primer acceso.
