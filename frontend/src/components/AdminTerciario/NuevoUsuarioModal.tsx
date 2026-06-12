import React, { useState } from "react";
import { X, Save } from "lucide-react";
import { apiClientV2 } from "../../api/client";
import { P } from "./AdminUI";
import { RolYAccesoForm } from "./UsuariosPanel";

interface ModalFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  error?: string;
}

function ModalField({ label, value, onChange, type = "text", placeholder = "", error = "" }: ModalFieldProps) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wide text-[#1a1f4e]/50 mb-1 block">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className={`w-full rounded-xl px-3 py-2 border text-[#1a1f4e] text-sm focus:outline-none focus:ring-2 focus:ring-[#f5c518] ${error ? "border-red-400" : "border-[#b8ccd8]"}`} />
      {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
    </div>
  );
}

interface NuevoUsuarioModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export function NuevoUsuarioModal({ onClose, onSaved }: NuevoUsuarioModalProps) {
  const [form, setForm] = useState({ username: "", email: "", first_name: "", last_name: "", password: "" });
  const [grupos, setGrupos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.username.trim()) e.username = "Requerido";
    if (!form.email.trim()) e.email = "Requerido";
    if (!form.first_name.trim()) e.first_name = "Requerido";
    if (!form.last_name.trim()) e.last_name = "Requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    setMsg("");
    try {
      await apiClientV2.post("/users", {
        username: form.username.trim(),
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        password: form.password.trim() || undefined,
        groups: grupos,
      });
      setMsg("Usuario creado. Se enviaron las credenciales por email.");
      setTimeout(() => { onSaved(); onClose(); }, 1500);
    } catch (err: unknown) {
      setMsg("Error al crear usuario.");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-[#b8ccd8] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[#b8ccd8] rounded-t-3xl" style={{ background: P.navy }}>
          <div>
            <p className="text-white font-black text-base">Nuevo Usuario</p>
            <p className="text-[#f5c518] text-xs mt-0.5">Se enviará un email con las credenciales generadas</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Apellido" value={form.last_name} onChange={e => set("last_name", e.target.value)} error={errors.last_name} />
            <ModalField label="Nombre" value={form.first_name} onChange={e => set("first_name", e.target.value)} error={errors.first_name} />
          </div>
          <ModalField label="Usuario (DNI)" value={form.username} onChange={e => set("username", e.target.value)} placeholder="ej: 28126358" error={errors.username} />
          <ModalField label="Email" value={form.email} onChange={e => set("email", e.target.value)} type="email" placeholder="docente@institución.edu.ar" error={errors.email} />
          <ModalField label="Contraseña (opcional — se genera automáticamente si se deja vacío)" value={form.password} onChange={e => set("password", e.target.value)} type="password" />
          <RolYAccesoForm grupos={grupos} is_superuser={false} onChange={setGrupos} />
          {msg && (
            <p className={`text-xs font-semibold px-3 py-2 rounded-xl ${msg.includes("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
              {msg}
            </p>
          )}
        </div>

        <div className="p-5 border-t border-[#b8ccd8] flex gap-3">
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60 hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
            style={{ background: P.navy, color: P.yellow }}>
            <Save size={15} /> {saving ? "Creando..." : "Crear usuario"}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm border border-[#b8ccd8] text-[#1a1f4e] hover:bg-[#b8ccd8]/20 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
