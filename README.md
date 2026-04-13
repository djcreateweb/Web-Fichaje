# Web-Fichaje

Aplicación de **fichaje/registro horario** con:

- **Frontend** (React): interfaz de usuario.
- **Backend** (Laravel): API y lógica de negocio.
- **MySQL**: persistencia de datos.
- **Sanctum**: autenticación de la API.

## Cómo funciona la aplicación

- **Inicio de sesión**: el frontend autentica contra la API y trabaja con sesión/token gestionado por Sanctum.
- **Operación diaria**:
  - el frontend consume endpoints de la API (crear/consultar fichajes, empleados, solicitudes, etc.).
  - el backend valida permisos por rol y guarda/consulta datos en MySQL.
- **Control de permisos**: cada rol ve y puede operar solo en los apartados permitidos.

## Apartados por rol

### Superadmin

- Gestión global de la plataforma (visión completa).
- Alta/gestión de tenants/empresas (según configuración del backend).
- Acceso a herramientas avanzadas de administración y auditoría.

### Admin

- Gestión de empresa: empleados, parámetros y configuración operativa.
- Visualización y gestión de fichajes del equipo.
- Gestión de solicitudes (por ejemplo ausencias/permisos) y su estado.
- Acceso a listados e informes operativos.

### Superior

- Supervisión del equipo asignado.
- Revisión y aprobación/gestión de solicitudes del equipo.
- Consulta de fichajes y registros del equipo (según permisos).

### Empleado

- Realizar fichajes (entrada/salida) desde la app.
- Consultar sus propios registros e historial.
- Crear y consultar sus propias solicitudes (según funcionalidad habilitada).
