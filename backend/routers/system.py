import platform
import socket
import psutil
from datetime import datetime, timezone

from fastapi import APIRouter

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


@router.get("")
def get_system_info():
    uname = platform.uname()
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    uptime_seconds = int(datetime.now(timezone.utc).timestamp() - psutil.boot_time())
    uptime_days = uptime_seconds // 86400
    uptime_hours = (uptime_seconds % 86400) // 3600

    return {
        "hostname": uname.node,
        "os": f"{uname.system} {uname.release}",
        "arch": uname.machine,
        "ip": _get_ip(),
        "cpu_count": psutil.cpu_count(),
        "cpu_percent": psutil.cpu_percent(interval=0.1),
        "mem_total_mb": mem.total // (1024 * 1024),
        "mem_used_mb": mem.used // (1024 * 1024),
        "mem_percent": mem.percent,
        "disk_total_gb": round(disk.total / (1024 ** 3), 1),
        "disk_used_gb": round(disk.used / (1024 ** 3), 1),
        "disk_percent": disk.percent,
        "uptime": f"{uptime_days}d {uptime_hours}h",
    }
