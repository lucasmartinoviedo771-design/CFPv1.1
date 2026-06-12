import React, { useState, useEffect, useCallback } from "react";
import { Search, X, Save, Pencil, RefreshCw, CheckCircle2, XCircle, UserPlus, KeyRound, ShieldAlert } from "lucide-react";
import { apiClientV2 } from "../../api/client";
import { User } from "../../api/types";

const ROLES_VIDEOJUEGOS = [
  { nombre: "Videojuegos", label: "Coordinador Videojuegos", color: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" },
  { nombre: "Admin", label: "Administrador General", color: "bg-purple-500/20 text-purple-300 border border-purple-500/30" },
  { nombre: "Secretaría", label: "Secretaría General", color: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" },
  { nombre: "Docente", label: "Docente / Instructor", color: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" },
];

interface RoleBadgeProps {
  nombre: string;
}

function RoleBadge({ nombre }: RoleBadgeProps) {
  const r = ROLES_VIDEOJUEGOS.find(x => x.nombre === nombre);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${r?.color || "bg-indigo-950 text-indigo-300 border border-indigo-500/20"}`}>
      {r?.label || nombre}
    </span>
  );
}

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

function InputField({ label, name, value, onChange, type = "text", placeholder = "", error = "", required = false }: InputFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black uppercase tracking-widest text-[#00ccff] block">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full rounded-2xl px-4 py-2.5 bg-indigo-950/40 border text-white text-sm focus:border-[#00ccff]/70 focus:outline-none transition-all ${
          error ? "border-rose-500/50" : "border-indigo-500/25"
        }`}
      />
      {error && <p className="text-rose-400 text-xs mt-0.5">{error}</p>}
    </div>
  );
}

interface UserGroupsSelectorProps {
  selectedGroups: string[];
  onChange: (groups: string[]) => void;
}

function UserGroupsSelector({ selectedGroups, onChange }: UserGroupsSelectorProps) {
  const toggleGroup = (groupName: string) => {
    if (selectedGroups.includes(groupName)) {
      onChange(selectedGroups.filter((g) => g !== groupName));
    } else {
      onChange([...selectedGroups, groupName]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-[#00ccff] block">Asignar Grupos / Roles</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ROLES_VIDEOJUEGOS.map((r) => {
          const active = selectedGroups.includes(r.nombre);
          return (
            <button
              key={r.nombre}
              type="button"
              onClick={() => toggleGroup(r.nombre)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-xs font-bold uppercase transition-all ${
                active
                  ? "border-[#00ccff] bg-[#00ccff]/10 text-white shadow-[0_0_10px_rgba(0,255,255,0.1)]"
                  : "border-indigo-500/25 bg-indigo-950/20 text-indigo-300 hover:border-indigo-500/50"
              }`}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => {}} // handled by button click
                className="accent-[#00ccff]"
              />
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface NuevoUsuarioModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function NuevoUsuarioModal({ onClose, onSaved }: NuevoUsuarioModalProps) {
  const [form, setForm] = useState({ username: "", email: "", first_name: "", last_name: "", password: "" });
  const [grupos, setGrupos] = useState<string[]>(["Videojuegos"]);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const save = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await apiClientV2.post("/users", {
        username: form.username.trim(),
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        password: form.password.trim() || undefined,
        groups: grupos,
      });
      setSuccess("Usuario creado correctamente. Se enviarán las credenciales por email.");
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { detail?: string } } };
      setError(axiosError.response?.data?.detail || "Ocurrió un error al crear el usuario.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-[#0c122c] border border-indigo-500/20 rounded-[2.5rem] w-full max-w-lg my-8 shadow-2xl relative overflow-hidden flex flex-col">
        <div className="p-6 border-b border-indigo-500/10 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">Nuevo Usuario de Videojuegos</h3>
            <p className="text-[10px] font-bold text-indigo-300 mt-1 uppercase">Se enviará un email con las credenciales de acceso</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-indigo-300 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={save} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold flex items-center gap-2">
              <ShieldAlert size={16} /> {error}
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} /> {success}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <InputField label="Apellido" name="last_name" value={form.last_name} onChange={handleChange} required />
            <InputField label="Nombre" name="first_name" value={form.first_name} onChange={handleChange} required />
          </div>
          <InputField label="Usuario / DNI" name="username" value={form.username} onChange={handleChange} required placeholder="ej: 28126358" />
          <InputField label="Email" name="email" value={form.email} onChange={handleChange} required type="email" placeholder="coordinador@politecnico.ar" />
          <InputField label="Contraseña (Opcional - Autogenerada si se deja vacío)" name="password" value={form.password} onChange={handleChange} type="password" />

          <UserGroupsSelector selectedGroups={grupos} onChange={setGrupos} />
        </form>

        <div className="p-6 border-t border-indigo-500/10 flex justify-end gap-3 bg-[#0a0d24]">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest">
            Cancelar
          </button>
          <button type="button" onClick={save} disabled={saving} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-accent text-[#050814] font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all">
            <Save size={14} /> {saving ? "Creando..." : "Crear Usuario"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditUsuarioModalProps {
  user: User;
  onClose: () => void;
  onSaved: () => void;
}

function EditUsuarioModal({ user, onClose, onSaved }: EditUsuarioModalProps) {
  const [grupos, setGrupos] = useState<string[]>(user.groups || []);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const save = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await apiClientV2.patch(`/users/${user.id}`, { groups: grupos });
      setSuccess("Grupos actualizados correctamente.");
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      console.error(err);
      setError("Ocurrió un error al actualizar los grupos.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-[#0c122c] border border-indigo-500/20 rounded-[2.5rem] w-full max-w-lg my-8 shadow-2xl relative overflow-hidden flex flex-col">
        <div className="p-6 border-b border-indigo-500/10 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">{user.last_name}, {user.first_name}</h3>
            <p className="text-[10px] font-bold text-indigo-300 mt-1 uppercase">{user.username} · {user.email}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-indigo-300 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={save} className="p-6 space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold flex items-center gap-2">
              <ShieldAlert size={16} /> {error}
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} /> {success}
            </div>
          )}

          <UserGroupsSelector selectedGroups={grupos} onChange={setGrupos} />
        </form>

        <div className="p-6 border-t border-indigo-500/10 flex justify-end gap-3 bg-[#0a0d24]">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest">
            Cancelar
          </button>
          <button type="button" onClick={save} disabled={saving} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-accent text-[#050814] font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all">
            <Save size={14} /> {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsuariosTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resettingId, setResettingId] = useState<number | null>(null);
  const [nuevoModal, setNuevoModal] = useState<boolean>(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClientV2.get<User[]>("/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const resetPassword = async (u: User) => {
    if (!window.confirm(`¿Regenerar contraseña para ${u.username}? Se enviará al correo.`)) return;
    setResettingId(u.id);
    try {
      await apiClientV2.post(`/users/${u.id}/regenerate-password`);
      alert("Contraseña regenerada correctamente.");
    } catch (err: unknown) {
      console.error(err);
      alert("Error al regenerar contraseña.");
    } finally {
      setResettingId(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase().trim();
    const matchQ = (
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q)
    );
    return matchQ;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-grow max-w-md w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usuario..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl text-white placeholder-indigo-400 text-sm font-semibold focus:border-[#00ccff]/70 focus:outline-none transition-all"
          />
        </div>
        <button
          onClick={() => setNuevoModal(true)}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-cyan to-brand-accent text-[#050814] font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]"
        >
          <UserPlus size={16} /> Nuevo Usuario
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-[#0c122c]/20 border border-indigo-500/10 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-indigo-300 font-bold uppercase tracking-wider space-y-4">
            <div className="animate-spin text-[#00ccff]"><UserPlus size={40} /></div>
            <p className="text-xs">Cargando personal...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-indigo-400 font-semibold text-sm">
            No se encontraron usuarios registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#0c122c]/70 border-b border-indigo-500/10 text-indigo-300 text-xs font-black uppercase tracking-widest">
                  <th className="px-6 py-4.5">Usuario</th>
                  <th className="px-6 py-4.5">Nombre</th>
                  <th className="px-6 py-4.5">Roles / Grupos</th>
                  <th className="px-6 py-4.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-500/5 bg-transparent">
                {filtered.map((u) => {
                  return (
                    <tr key={u.id} className="hover:bg-[#00ccff]/5 transition-all duration-300">
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-white text-base">{u.username}</p>
                          <p className="text-xs text-indigo-300 font-semibold">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-white/90">
                          {u.last_name}, {u.first_name}
                        </span>
                        {(u.is_superuser || u.is_staff) && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">SuperAdmin</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {u.groups?.map((g) => <RoleBadge key={g} nombre={g} />)}
                          {(!u.groups || u.groups.length === 0) && <span className="text-xs text-indigo-500 italic">—</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditUser(u)}
                            className="p-2 rounded-xl bg-indigo-500/10 hover:bg-[#00ccff] hover:text-[#050814] text-[#00ccff] border border-[#00ccff]/20 transition-all"
                            title="Editar roles"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => resetPassword(u)}
                            disabled={resettingId === u.id}
                            className="p-2 rounded-xl bg-indigo-500/10 hover:bg-[#FF6600] hover:text-[#050814] text-[#FF6600] border border-[#FF6600]/20 transition-all disabled:opacity-40"
                            title="Regenerar contraseña"
                          >
                            <RefreshCw size={14} className={resettingId === u.id ? "animate-spin" : ""} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Nuevo Usuario Modal */}
      {nuevoModal && <NuevoUsuarioModal onClose={() => setNuevoModal(false)} onSaved={fetchUsers} />}

      {/* Editar Usuario Modal */}
      {editUser && <EditUsuarioModal user={editUser} onClose={() => setEditUser(null)} onSaved={fetchUsers} />}
    </div>
  );
}
