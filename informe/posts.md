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

## Por qué separar app y base de datos

La separación tiene sentido desde el punto de vista de seguridad y escalabilidad: si la base de datos necesita más recursos, se puede ajustar el CT sin tocar la app.

El acceso entre contenedores está restringido a nivel de `pg_hba.conf`, permitiendo conexiones **solo desde la IP del CT de la aplicación**.

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

## Base de datos

PostgreSQL corre en un contenedor separado. El esquema tiene tres tablas: `posts`, `profile`, y `changelog`. Las migraciones se manejan con `create_all` de SQLAlchemy al arrancar.

## Deploy

El frontend se buildea en la PC de desarrollo y se commitea el `dist/` al repo. El CT tiene solo 128MB de RAM, insuficiente para correr `npm install`, así que nginx sirve los archivos estáticos directamente desde `/var/www/blog/dist`.
```
