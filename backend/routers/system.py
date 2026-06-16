import asyncio
import json
import platform
import socket
from datetime import datetime, timezone

import psutil
from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse
from database import get_db
import sqlalchemy

router = APIRouter(prefix="/api/system", tags=["system"])


def _get_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "unavailable"


def _distro() -> str:
    try:
        with open("/etc/os-release") as f:
            info = dict(
                line.strip().split("=", 1)
                for line in f
                if "=" in line
            )
        name = info.get("PRETTY_NAME", "").strip('"')
        return name if name else platform.system()
    except Exception:
        return platform.system()


def _snapshot() -> dict:
    uname = platform.uname()
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    uptime_s = int(datetime.now(timezone.utc).timestamp() - psutil.boot_time())
    return {
        "hostname": uname.node,
        "os": f"{_distro()} · {uname.release}",
        "arch": uname.machine,
        "ip": _get_ip(),
        "cpu_count": psutil.cpu_count(),
        "cpu_percent": psutil.cpu_percent(interval=None),
        "mem_total_mb": mem.total // (1024 * 1024),
        "mem_used_mb": mem.used // (1024 * 1024),
        "mem_percent": mem.percent,
        "disk_total_gb": round(disk.total / (1024 ** 3), 1),
        "disk_used_gb": round(disk.used / (1024 ** 3), 1),
        "disk_percent": disk.percent,
        "uptime": f"{uptime_s // 86400}d {(uptime_s % 86400) // 3600}h {(uptime_s % 3600) // 60}m",
    }


def _check_db() -> bool:
    try:
        db = next(get_db())
        db.execute(sqlalchemy.text("SELECT 1"))
        return True
    except Exception:
        return False


@router.get("/schema")
def get_schema():
    db = next(get_db())
    cols = db.execute(sqlalchemy.text("""
        SELECT c.table_name, c.column_name, c.data_type, c.character_maximum_length,
               c.is_nullable, c.column_default,
               CASE WHEN kcu.column_name IS NOT NULL THEN true ELSE false END AS is_pk
        FROM information_schema.columns c
        LEFT JOIN information_schema.key_column_usage kcu
            ON kcu.table_name = c.table_name
            AND kcu.column_name = c.column_name
            AND kcu.constraint_name IN (
                SELECT constraint_name FROM information_schema.table_constraints
                WHERE constraint_type = 'PRIMARY KEY' AND table_schema = 'public'
            )
        WHERE c.table_schema = 'public'
        ORDER BY c.table_name, c.ordinal_position
    """)).fetchall()

    fks = db.execute(sqlalchemy.text("""
        SELECT kcu.table_name, kcu.column_name,
               ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    """)).fetchall()

    tables: dict = {}
    for row in cols:
        t = row.table_name
        if t not in tables:
            tables[t] = []
        TYPE_MAP = {
            "timestamp with time zone": "timestamp",
            "timestamp without time zone": "timestamp",
            "character varying": "varchar",
        }
        col_type = TYPE_MAP.get(row.data_type, row.data_type)
        if row.character_maximum_length:
            col_type = f"{col_type}({row.character_maximum_length})"
        tables[t].append({
            "name": row.column_name,
            "type": col_type,
            "pk": bool(row.is_pk),
            "nullable": row.is_nullable == "YES",
        })

    return {
        "tables": [{"name": t, "columns": cols} for t, cols in tables.items()],
        "foreign_keys": [
            {"table": r.table_name, "column": r.column_name,
             "ref_table": r.foreign_table, "ref_column": r.foreign_column}
            for r in fks
        ],
    }


@router.get("/health")
def health():
    return {
        "api": True,
        "db": _check_db(),
    }


@router.get("")
def get_system_info():
    return _snapshot()


@router.get("/stream")
async def stream_system_info(request: Request):
    async def event_gen():
        while True:
            if await request.is_disconnected():
                break
            yield {"data": json.dumps(_snapshot())}
            await asyncio.sleep(1)

    return EventSourceResponse(event_gen())
