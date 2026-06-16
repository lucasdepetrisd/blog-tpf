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


def _snapshot() -> dict:
    uname = platform.uname()
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    uptime_s = int(datetime.now(timezone.utc).timestamp() - psutil.boot_time())
    return {
        "hostname": uname.node,
        "os": f"{uname.system} {uname.release}",
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
