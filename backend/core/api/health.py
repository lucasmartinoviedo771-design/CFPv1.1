from ninja import Router

router = Router(tags=["health"])


@router.get("", auth=None)
def healthcheck(request):
    """Health basico para monitoreo."""
    return {"status": "ok"}
