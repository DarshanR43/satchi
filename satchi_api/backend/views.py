from django.db import connections
from django.db.utils import OperationalError
from django.http import JsonResponse


def health_check(_request):
    try:
        with connections["default"].cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except OperationalError as exc:
        return JsonResponse(
            {
                "status": "error",
                "database": "unavailable",
                "detail": str(exc),
            },
            status=503,
        )

    return JsonResponse({"status": "ok", "database": "available"})
