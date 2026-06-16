# TPF: Blog Personal en Proxmox

## Objetivo

Implementar un servicio de Blog Personal sobre infraestructura de contenedores en Proxmox.

---

## Infraestructura

### Contenedor 1 — Blog Personal

| Parámetro | Valor |
|---|---|
| Nombre | `43362480A` |
| RAM | 128 MB |
| CPU | 1 |
| Disco | 8 GB |
| IP | `172.16.90.<ID>/24` |
| Gateway | `172.16.90.1` |
| DNS | `172.16.90.1` |

### Contenedor 2 — Base de datos

| Parámetro | Valor |
|---|---|
| Nombre | `43362480DB` |
| RAM | 128 MB |
| CPU | 1 |
| Disco | 8 GB |
| IP | `172.16.90.<ID>/24` |
| Gateway | `172.16.90.1` |
| DNS | `172.16.90.1` |

> La IP se construye como `172.16.90.ID` donde ID es el número que Proxmox asigna al crear el contenedor (ej. si el ID es 102, la IP es `172.16.90.102`).

---

## Requerimientos del Blog

- Datos personales del alumno
- Imagen personal
- Página principal actualizable (agregar nuevos posts)
- Informe del desarrollo en formato PDF disponible en el blog

---

## Acceso

- URL externa: `nap.frt.utn.edu.ar`

---

## Entrega

- Informe en PDF adjunto a la tarea y publicado en el blog
- Defensa presencial coordinada con el docente (condición para promocionar)
