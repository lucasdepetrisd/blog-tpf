# Plan de implementación — TPF Blog Personal

## Stack

| Componente | Tecnología |
|---|---|
| Backend | Python + FastAPI |
| Frontend | React + Tailwind + shadcn/ui |
| Base de datos | PostgreSQL |
| Servidor web | nginx (reverse proxy) |
| Infraestructura | Proxmox LXC |

---

## Contenedores

| Contenedor | Nombre | IP | Contenido |
|---|---|---|---|
| 1 — Blog | `43362480A` | `172.16.90.<ID>` | FastAPI + React + nginx |
| 2 — DB | `43362480DB` | `172.16.90.<ID>` | PostgreSQL |

---

## Estructura del proyecto

```
tpf/
├── backend/          # FastAPI
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   └── requirements.txt
├── frontend/         # React + Tailwind + shadcn/ui
│   ├── src/
│   └── package.json
├── nginx/
│   └── nginx.conf
├── tarea.md
└── plan.md
```

---

## Funcionalidades del blog

- [ ] Página principal con lista de posts
- [ ] Crear nuevo post (título + contenido)
- [ ] Datos personales (nombre, foto)
- [ ] PDF del informe disponible para descarga
- [ ] Diseño responsive con Tailwind + shadcn/ui

---

## Fases de implementación

### Fase 1 — Base de datos
- Crear contenedor `43362480DB` en Proxmox
- Instalar y configurar PostgreSQL
- Crear base de datos y tabla `posts`

### Fase 2 — Backend
- Crear contenedor `43362480A` en Proxmox
- Instalar Python + FastAPI
- Endpoints:
  - `GET /posts` — listar posts
  - `POST /posts` — crear post
  - `GET /posts/{id}` — obtener post
  - `GET /static/informe.pdf` — descargar PDF

### Fase 3 — Frontend
- App React con React Router
- Páginas:
  - `/` — home con lista de posts
  - `/post/:id` — detalle de post
  - `/about` — datos personales + foto
- Build estático servido por nginx

### Fase 4 — nginx
- Configurar reverse proxy en el contenedor blog
- `/api/*` → FastAPI (puerto 8000)
- `/*` → React build estático

### Fase 5 — Informe PDF
- Redactar informe del desarrollo
- Subirlo al contenedor como archivo estático

### Fase 6 — Acceso externo
- Coordinar con la UTN el acceso via `nap.frt.utn.edu.ar`

---

## Pendiente decidir

- [ ] DNI confirmado: `43362480` ✓
- [ ] IDs de los contenedores (se saben al crearlos en Proxmox)
- [ ] Credenciales de acceso a `nap.frt.utn.edu.ar`
