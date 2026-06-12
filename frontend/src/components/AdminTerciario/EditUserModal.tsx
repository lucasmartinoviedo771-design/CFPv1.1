import React, { useState } from "react";
import { X, Save } from "lucide-react";
import { apiClientV2 } from "../../api/client";
import { P } from "./AdminUI";
import { User } from "../../api/types";
import { RolYAccesoForm } from "./UsuariosPanel";

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSaved: () => void;
}

export function EditUserModal({ user, onClose, onSaved }: EditUserModalProps) {
  const [grupos, setGrupos] = useState<string[]>(user.groups || []);
  const [saving, setSaving] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      await apiClientV2.patch(`/users/${user.id}`, { groups: grupos });
      setMsg("Guardado.");
      onSaved();
    } catch (err: unknown) { setMsg("Error al guardar."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-[#b8ccd8] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[#b8ccd8] rounded-t-3xl" style={{ background: P.navy }}>
          <div>
            <p className="text-white font-black">{user.last_name} {user.first_name}</p>
            <p className="text-[#f5c518] text-xs">{user.username} · {user.email}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <RolYAccesoForm grupos={grupos} is_superuser={!!(user.is_superuser || user.is_staff)} onChange={setGrupos} />
          {msg && <p className={`text-xs font-semibold ${msg.includes("Error") ? "text-red-500" : "text-green-600"}`}>{msg}</p>}
        </div>

        <div className="p-5 border-t border-[#b8ccd8] flex gap-3">
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60 hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
            style={{ background: P.navy, color: P.yellow }}>
            <Save size={15} /> {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm border border-[#b8ccd8] text-[#1a1f4e] hover:bg-[#b8ccd8]/20 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
