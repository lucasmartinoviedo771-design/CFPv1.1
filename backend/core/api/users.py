from typing import List
from django.contrib.auth.models import User, Group
from django.shortcuts import get_object_or_404
from ninja import Router

from core.serializers import UserSerializer, GroupSerializer
from core.api.permissions import require_admin

router = Router(tags=["users"])


def _ensure_admin(user):
    if user.is_staff or user.is_superuser:
        return True
    return user.groups.filter(name="Admin").exists()


@router.get("/users", response=List[dict])
@require_admin
def listar_users(request):
    qs = User.objects.all().order_by("username")
    return UserSerializer(qs, many=True).data


@router.post("/users", response=dict)
@require_admin
def crear_user(request, payload: dict):
    serializer = UserSerializer(data=payload)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return UserSerializer(user).data


@router.put("/users/{user_id}", response=dict)
@router.patch("/users/{user_id}", response=dict)
@require_admin
def actualizar_user(request, user_id: int, payload: dict):
    user = get_object_or_404(User, pk=user_id)
    serializer = UserSerializer(instance=user, data=payload, partial=True)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return UserSerializer(user).data


@router.delete("/users/{user_id}", response=dict)
@require_admin
def eliminar_user(request, user_id: int):
    user = get_object_or_404(User, pk=user_id)
    user.delete()
    return {"deleted": True, "id": user_id}


@router.get("/groups", response=List[dict])
@require_admin
def listar_grupos(request):
    qs = Group.objects.all().order_by("name")
    return GroupSerializer(qs, many=True).data
