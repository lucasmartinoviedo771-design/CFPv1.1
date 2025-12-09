import os
import json
from io import StringIO
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.core.management import call_command
from ninja import Router, File
from ninja.files import UploadedFile
from core.api.permissions import require_authenticated_group

router = Router(tags=["imports"])


def _save_temp(file_obj: UploadedFile, folder: str):
    tmp_dir = os.path.join(settings.BASE_DIR, folder)
    os.makedirs(tmp_dir, exist_ok=True)
    fs = FileSystemStorage(location=tmp_dir)
    filename = fs.save(file_obj.name, file_obj)
    return fs, fs.path(filename), tmp_dir, filename


@router.post("/import-inscripciones", response=dict)
@require_authenticated_group
def import_inscripciones(request, file: UploadedFile = File(...)):
    fs, file_path, tmp_dir, filename = _save_temp(file, "tmp")
    output = StringIO()
    try:
        call_command("import_inscripciones", f"--file={file_path}", stdout=output)
        return json.loads(output.getvalue() or "{}")
    except Exception as e:
        return 500, {"error": str(e)}
    finally:
        try:
            os.remove(file_path)
        except OSError:
            pass


@router.post("/import-asistencia", response=dict)
@require_authenticated_group
def import_asistencia(request, file: UploadedFile = File(...)):
    fs, file_path, tmp_dir, filename = _save_temp(file, "tmp_asistencia")
    output = StringIO()
    try:
        call_command("import_asistencia", f"--dir={tmp_dir}", stdout=output)
        return json.loads(output.getvalue() or "{}")
    except Exception as e:
        return 500, {"error": str(e)}
    finally:
        try:
            os.remove(file_path)
            os.rmdir(tmp_dir)
        except OSError:
            pass


@router.post("/import-notas", response=dict)
@require_authenticated_group
def import_notas(request, file: UploadedFile = File(...)):
    fs, file_path, tmp_dir, filename = _save_temp(file, "tmp")
    output = StringIO()
    try:
        call_command("import_notas", f"--file={file_path}", stdout=output)
        return json.loads(output.getvalue() or "{}")
    except Exception as e:
        return 500, {"error": str(e)}
    finally:
        try:
            os.remove(file_path)
        except OSError:
            pass
