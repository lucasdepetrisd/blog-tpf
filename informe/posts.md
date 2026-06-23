# Post 1

**Título:** Arquitectura del proyecto: dos contenedores LXC en Proxmox

**Tags:** infraestructura,proxmox,lxc,arquitectura

**Contenido:**

```
Para el TPF de Virtualización decidí separar la aplicación en **dos contenedores LXC** corriendo sobre Proxmox VE en la infraestructura de la UTN FRT.

## Contenedores

| CT | IP | Servicios |
|----|----|-----------|
| 43362480A | 172.16.90.215 | React + FastAPI + nginx |
| 43362480DB | 172.16.90.207 | PostgreSQL 16 |

## Por qué LXC y no VMs

Los contenedores LXC comparten el kernel del host, lo que los hace mucho más livianos que una VM completa. Un CT Debian con nginx y Python arranca en segundos y consume menos de 128MB de RAM en reposo. Para este proyecto eso es suficiente: no hay necesidad de aislar el kernel ni correr un SO diferente.

## Por qué separar app y base de datos

La separación tiene sentido desde el punto de vista de seguridad y escalabilidad: si la base de datos necesita más recursos, se puede ajustar el CT sin tocar la app.

El acceso entre contenedores está restringido a nivel de `pg_hba.conf`, permitiendo conexiones **solo desde la IP del CT de la aplicación**. Cualquier otro host recibe un rechazo directo de PostgreSQL, independientemente de la red.

## Un problema real: encoding de la base de datos

Al crear la base de datos en Debian sin configurar el locale del sistema, PostgreSQL la inicializa con encoding `SQL_ASCII`. Cualquier carácter fuera de ASCII (tildes, ñ) genera un `UnicodeEncodeError` en Python.

La solución fue recrear la DB especificando encoding explícito:

```sql
CREATE DATABASE blog_db ENCODING 'UTF8' LC_COLLATE 'C.UTF-8' LC_CTYPE 'C.UTF-8' TEMPLATE template0;
```

## nginx como punto de entrada

nginx actúa como único punto de entrada:

- Sirve el build estático del frontend desde `/var/www/blog/dist`
- Hace proxy reverso hacia uvicorn para las rutas `/api/`
- Maneja SSE deshabilitando el buffering en `/api/system/stream`
```

---

# Post 2

**Título:** Stack técnico: React + FastAPI + PostgreSQL

**Tags:** react,fastapi,postgresql,stack

**Contenido:**

```
El stack elegido para este blog fue pensado para ser **simple pero representativo** de un sistema web moderno.

## Frontend

- **React 19** con TypeScript
- **Vite** como bundler
- **Tailwind v4** para estilos
- Sin librerías de estado globales: todo con hooks locales y fetch directo a la API

## Backend

- **FastAPI** con SQLAlchemy como ORM
- **psycopg2** para conectarse a PostgreSQL
- **JWT** con python-jose para autenticación
- **SSE** para métricas del sistema en tiempo real

## Por qué SSE y no WebSockets

La pestaña *system* muestra métricas del CT (CPU, RAM, disco) actualizándose en tiempo real. Para esto se usa **Server-Sent Events** en lugar de WebSockets.

SSE es unidireccional: el servidor empuja datos al cliente sin que el cliente tenga que pedir nada. Es suficiente para métricas de monitoreo y mucho más simple de implementar que un WebSocket bidireccional. nginx solo necesita `proxy_buffering off` para que los eventos lleguen en tiempo real.

## Autenticación con JWT

El panel admin está protegido con JWT. Al hacer login, el backend genera un token firmado con una clave secreta. El frontend lo guarda en `localStorage` y lo incluye en cada request como `Authorization: Bearer <token>`.

No hay refresh tokens ni sesiones en base de datos: si el token expira, el usuario vuelve a hacer login.

## Base de datos

PostgreSQL corre en un contenedor separado. El esquema tiene dos tablas: `posts` y `profile`. Las tablas se crean automáticamente con `create_all` de SQLAlchemy al arrancar el backend, sin necesidad de correr migraciones manualmente.

## Deploy

El frontend se buildea en la PC de desarrollo y se commitea el `dist/` al repo. El CT tiene solo 128MB de RAM, insuficiente para correr `npm install`, así que nginx sirve los archivos estáticos directamente desde `/var/www/blog/dist`.
```

---

# Post 3

**Título:** Deploy en dos contenedores LXC: estrategia y flujo de trabajo

**Tags:** deploy,lxc,proxmox,nginx,ci

**Contenido:**

```
El proceso de despliegue del blog está pensado para un entorno con restricciones reales: los contenedores LXC tienen solo **128MB de RAM**, lo que hace imposible correr `npm install` o compilar en el servidor.

## Separación de responsabilidades

El build del frontend ocurre en la PC de desarrollo. El CT solo recibe y sirve archivos ya compilados.

| Paso | Dónde ocurre |
|------|--------------|
| `npm run build` | PC local |
| `git push` | PC local → GitHub |
| `git pull` + rsync | CT 43362480A |
| restart uvicorn | CT 43362480A |

## Bundle único con vite-plugin-singlefile

Usamos `vite-plugin-singlefile` para empaquetar todo el frontend en un único `index.html`. El plugin inlinea el JavaScript, el CSS y los íconos SVG como data URIs dentro del HTML.

El resultado es un solo archivo de ~3.5MB que funciona sin depender de que el servidor sirva assets adicionales por separado.

## Scripts de actualización

Para simplificar el deploy incremental, hay dos scripts en `scripts/`:

- `update-front.sh`: hace `git pull` y sincroniza el dist con rsync, preservando la carpeta `static/` donde vive el PDF subido desde el panel admin.
- `update-nginx.sh`: hace `git pull` y recarga la configuración de nginx.

El rsync usa `--exclude='static/'` para no borrar archivos generados en runtime que no están versionados en el repo.

## Routing bajo un prefijo

La URL pública del blog vive bajo `/43362480/`. Esto requiere configurar el `basename` del router de React y prefijar todas las llamadas a la API con ese path. El valor se inyecta en tiempo de build desde `.env.production`:

```
VITE_BASENAME=/43362480
```

En el código, todas las llamadas a la API y rutas de archivos estáticos usan `${BASE}` como prefijo, donde `BASE = import.meta.env.VITE_BASENAME || ''`.
```

---

# Post 4

**Título:** Guía de uso del blog

**Tags:** guia,admin,uso

**Contenido:**

```
Esta es una guía rápida para usar el blog.

## Navegar el blog

La página principal muestra todos los posts ordenados por fecha. Se puede filtrar por **tag** haciendo click en cualquiera de las etiquetas, o buscar por título con la barra de búsqueda.

Cada post renderiza Markdown: soporta títulos, negrita, cursiva, listas, tablas y bloques de código.

## Pestaña About

La sección *about* tiene cuatro pestañas:

- **about**: perfil del autor y datos del proyecto
- **infra**: diagrama interactivo de la infraestructura. El nodo de PostgreSQL es clickeable y muestra el ERD de la base de datos.
- **system**: métricas del CT en tiempo real (CPU, RAM, disco, uptime) via SSE
- **docs**: visor del informe en PDF (aparece solo si hay un PDF publicado)

## Panel Admin

El panel de administración está en `/admin`. Requiere login con usuario y contraseña.

Desde ahí se puede:

- **Posts**: crear, editar y eliminar posts. Los tags se agregan con Enter o coma; al pegar texto con comas se separan automáticamente.
- **Profile**: editar nombre y bio. La foto se puede cambiar o volver a la de GitHub.
- **Docs**: subir el informe en PDF. Una vez subido aparece el tab *docs* en la sección about.

## Markdown en posts

El contenido de los posts acepta Markdown estándar:

- `**negrita**`, `*cursiva*`
- `# Título`, `## Subtítulo`
- Listas con `-` o `1.`
- Tablas con `|`
- Código con \`backticks\` o bloques con \`\`\`
```
