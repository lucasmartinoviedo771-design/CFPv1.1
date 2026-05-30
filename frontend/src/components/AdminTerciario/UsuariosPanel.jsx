import React, { useState, useEffect, useCallback } from "react";
import { Search, X, Save, Pencil, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { apiClientV2 } from "../../api/client";
import { P } from "./AdminUI";

// Grupos que dan acceso a CFP (tener cualquiera de estos = puede entrar al panel CFP)
const GRUPOS_CFP = ["Admin", "Secretaría", "Regencia", "Coordinación Docente", "Docente", "Preceptor", "Bedel", "Rector"];
// Grupos que dan acceso a Terciario (Admin/Rector siempre tienen ambos; "Terciario" es el flag para el resto)
const GRUPOS_TERCIARIO = ["Admin", "Terciario", "Rector"];

// Roles funcionales (definen qué puede hacer el usuario, sin determinar el sistema por sí solos)
const ROLES_FUNCIONALES = [
  { nombre: "Admin",                color: "bg-purple-100 text-purple-800" },
  { nombre: "Rector",               color: "bg-blue-100 text-blue-800" },
  { nombre: "Regencia",             color: "bg-indigo-100 text-indigo-800" },
  { nombre: "Secretaría",           color: "bg-cyan-100 text-cyan-800" },
  { nombre: "Coordinación Docente", color: "bg-teal-100 text-teal-800" },
  { nombre: "Docente",              color: "bg-green-100 text-green-800" },
  { nombre: "Preceptor",            color: "bg-orange-100 text-orange-800" },
  { nombre: "Bedel",                color: "bg-rose-100 text-rose-800" },
];

export const GRUPOS_CONFIG = ROLES_FUNCIONALES.map(r => ({
  ...r,
  cfp: GRUPOS_CFP.includes(r.nombre),
  terciario: GRUPOS_TERCIARIO.includes(r.nombre) || r.nombre === "Terciario",
}));

function GrupoBadge({ nombre }) {
  const cfg = GRUPOS_CONFIG.find(g => g.nombre === nombre);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg?.color || "bg-gray-100 text-gray-600"}`}>
      {nombre}
    </span>
  );
}

function AccesoBadge({ tieneAcceso, sistema }) {
  return tieneAcceso
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700"><CheckCircle2 size={10} />{sistema}</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-400"><XCircle size={10} />{sistema}</span>;
}

function tieneAccesoCFP(user) {
  return user.is_superuser || user.is_staff || (user.groups.some(g => GRUPOS_CFP.includes(g)) && !user.groups.includes("Sin CFP"));
}
function tieneAccesoTerciario(user) {
  return user.is_superuser || user.is_staff || user.groups.some(g => GRUPOS_TERCIARIO.includes(g));
}

function derivarEstado(grupos, is_superuser) {
  const rolActual = ROLES_FUNCIONALES.find(r => grupos.includes(r.nombre))?.nombre || "";

  let accCFP = is_superuser;
  let accTerciario = is_superuser;

  if (!is_superuser) {
    if (rolActual === "Admin" || rolActual === "Rector" || rolActual === "Regencia") {
      accCFP = true;
      accTerciario = true;
    } else if (rolActual === "Coordinación Docente" || rolActual === "Docente" || rolActual === "Preceptor" || rolActual === "Bedel") {
      if (grupos.includes("Terciario")) {
        accCFP = false;
        accTerciario = true;
      } else {
        accCFP = true;
        accTerciario = false;
      }
    } else if (rolActual === "Secretaría") {
      accCFP = grupos.includes("Secretaría") && !grupos.includes("Sin CFP");
      accTerciario = grupos.includes("Terciario");
      if (!accCFP && !accTerciario) {
        accCFP = true;
      }
    } else {
      accCFP = false;
      accTerciario = false;
    }
  }

  return { rolActual, accCFP, accTerciario };
}

function construirGrupos(rol, accCFP, accTerciario, is_superuser) {
  if (is_superuser) return [];
  const grupos = [];

  if (rol) {
    if (rol === "Admin" || rol === "Rector" || rol === "Regencia") {
      grupos.push(rol);
      grupos.push("Terciario");
    } else if (rol === "Coordinación Docente" || rol === "Docente" || rol === "Preceptor" || rol === "Bedel") {
      grupos.push(rol);
      if (accTerciario) {
        grupos.push("Terciario");
      }
      if (!accCFP) {
        grupos.push("Sin CFP");
      }
    } else if (rol === "Secretaría") {
      grupos.push(rol);
      if (accTerciario) {
        grupos.push("Terciario");
      }
      if (!accCFP) {
        grupos.push("Sin CFP");
      }
    }
  }

  return grupos;
}

function RolYAccesoForm({ grupos, is_superuser, onChange }) {
  const { rolActual: derivedRol, accCFP, accTerciario } = derivarEstado(grupos, is_superuser);
  const [rolActual, setRolActual] = useState(derivedRol || "");

  useEffect(() => {
    if (derivedRol) setRolActual(derivedRol);
  }, [derivedRol]);

  const setRol = (nuevoRol) => {
    setRolActual(nuevoRol);
    let nuevoCFP = false;
    let nuevoTer = false;

    if (nuevoRol === "Admin" || nuevoRol === "Rector" || nuevoRol === "Regencia") {
      nuevoCFP = true;
      nuevoTer = true;
    } else if (nuevoRol === "Bedel") {
      nuevoCFP = false;
      nuevoTer = true;
    } else {
      nuevoCFP = true;
      nuevoTer = false;
    }

    const nuevosGrupos = construirGrupos(nuevoRol, nuevoCFP, nuevoTer, is_superuser);
    onChange(nuevosGrupos);
  };

  const toggleAcceso = (sistema) => {
    let nuevoCFP = accCFP;
    let nuevoTer = accTerciario;

    if (rolActual === "Coordinación Docente" || rolActual === "Docente" || rolActual === "Preceptor" || rolActual === "Bedel") {
      if (sistema === "cfp") { nuevoCFP = true; nuevoTer = false; }
      else { nuevoCFP = false; nuevoTer = true; }
    } else if (rolActual === "Secretaría") {
      if (sistema === "cfp") nuevoCFP = !accCFP;
      else nuevoTer = !accTerciario;
      
      if (!nuevoCFP && !nuevoTer) {
        onChange(construirGrupos(rolActual, accCFP, accTerciario, is_superuser));
        return;
      }
    }

    onChange(construirGrupos(rolActual, nuevoCFP, nuevoTer, is_superuser));
  };

  if (is_superuser) {
    return (
      <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
        SuperAdmin — acceso total a ambos sistemas, sin restricciones de grupo.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-[#1a1f4e]/40 mb-2">Rol</p>
        <div className="grid grid-cols-2 gap-2">
          {ROLES_FUNCIONALES.map(({ nombre, color }) => {
            const activo = rolActual === nombre;
            return (
              <label key={nombre} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${activo ? "border-[#f5c518] bg-[#f5c518]/10" : "border-[#b8ccd8] hover:bg-[#b8ccd8]/20"}`}>
                <input type="radio" name="rol" checked={activo} onChange={() => setRol(nombre)} className="accent-[#f5c518]" />
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{nombre}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-widest text-[#1a1f4e]/40 mb-2">Acceso al sistema</p>
        {(rolActual === "Admin" || rolActual === "Rector" || rolActual === "Regencia") ? (
          <p className="text-xs text-[#1a1f4e]/50 italic">El rol seleccionado tiene acceso a ambos sistemas automáticamente.</p>
        ) : (
          <div className="flex gap-3">
            {(() => {
              const deshabilitadoCFP = is_superuser || 
                !rolActual || 
                (rolActual === "Secretaría" && accCFP && !accTerciario) ||
                ((rolActual === "Coordinación Docente" || rolActual === "Docente" || rolActual === "Preceptor" || rolActual === "Bedel") && accCFP);

              const deshabilitadoTer = is_superuser || 
                !rolActual || 
                (rolActual === "Secretaría" && accTerciario && !accCFP) ||
                ((rolActual === "Coordinación Docente" || rolActual === "Docente" || rolActual === "Preceptor" || rolActual === "Bedel") && accTerciario);

              const tooltipCFP = (!rolActual) ? " (Seleccioná un rol)" : deshabilitadoCFP ? " (Requerido)" : "";
              const tooltipTer = (!rolActual) ? " (Seleccioná un rol)" : deshabilitadoTer ? " (Requerido)" : "";

              return (
                <>
                  <label className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all flex-1 ${
                    accCFP ? "border-indigo-400 bg-indigo-50" : "border-[#b8ccd8] hover:bg-[#b8ccd8]/20"
                  } ${deshabilitadoCFP ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
                    <input type="checkbox" checked={accCFP} disabled={deshabilitadoCFP} onChange={() => toggleAcceso("cfp")} className="accent-indigo-500" />
                    <span className="text-sm font-bold text-indigo-700">
                      Panel CFP<span className="text-[10px] font-normal text-indigo-500">{tooltipCFP}</span>
                    </span>
                  </label>

                  <label className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all flex-1 ${
                    accTerciario ? "border-[#f5c518] bg-[#f5c518]/10" : "border-[#b8ccd8] hover:bg-[#b8ccd8]/20"
                  } ${deshabilitadoTer ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
                    <input type="checkbox" checked={accTerciario} disabled={deshabilitadoTer} onChange={() => toggleAcceso("terciario")} className="accent-[#f5c518]" />
                    <span className="text-sm font-bold text-[#1a1f4e]">
                      Panel Terciario<span className="text-[10px] font-normal text-indigo-500">{tooltipTer}</span>
                    </span>
                  </label>
                </>
              );
            })()}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <AccesoBadge tieneAcceso={is_superuser || accCFP} sistema="CFP" />
        <AccesoBadge tieneAcceso={is_superuser || accTerciario} sistema="Terciario" />
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose, onSaved }) {
  const [grupos, setGrupos] = useState(user.groups || []);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      await apiClientV2.patch(`/users/${user.id}`, { groups: grupos });
      setMsg("Guardado.");
      onSaved();
    } catch { setMsg("Error al guardar."); }
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
          <RolYAccesoForm grupos={grupos} is_superuser={user.is_superuser || user.is_staff} onChange={setGrupos} />
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

function ModalField({ label, value, onChange, type = "text", placeholder = "", error = "" }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wide text-[#1a1f4e]/50 mb-1 block">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className={`w-full rounded-xl px-3 py-2 border text-[#1a1f4e] text-sm focus:outline-none focus:ring-2 focus:ring-[#f5c518] ${error ? "border-red-400" : "border-[#b8ccd8]"}`} />
      {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
    </div>
  );
}

function NuevoUsuarioModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ username: "", email: "", first_name: "", last_name: "", password: "" });
  const [grupos, setGrupos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
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
    } catch (err) {
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

const GRUPOS_PUEDEN_ASIGNAR = ["Admin", "Rector", "Regencia", "Secretaría"];

function puedeAsignarRoles(currentUser) {
  if (!currentUser) return false;
  if (currentUser.is_superuser || currentUser.is_staff) return true;
  return (currentUser.groups || []).some(g => GRUPOS_PUEDEN_ASIGNAR.includes(g));
}

export function UsuariosPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("todos"); 
  const [editUser, setEditUser] = useState(null);
  const [resettingId, setResettingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [nuevoModal, setNuevoModal] = useState(false);

  useEffect(() => {
    apiClientV2.get("/user").then(({ data }) => setCurrentUser(data)).catch(() => {});
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClientV2.get("/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const resetPassword = async (u) => {
    if (!window.confirm(`¿Regenerar contraseña para ${u.username}? Se enviará al email.`)) return;
    setResettingId(u.id);
    try {
      await apiClientV2.post(`/users/${u.id}/regenerate-password`);
    } catch {}
    finally { setResettingId(null); }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchQ = (
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q)
    );
    if (!matchQ) return false;
    const ter = tieneAccesoTerciario(u);
    const cfp = tieneAccesoCFP(u);
    if (filtro === "terciario") return ter;
    if (filtro === "ambos") return cfp && ter;
    if (filtro === "todos") return true;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#1a1f4e]">Usuarios</h1>
          <p className="text-[#1a1f4e]/50 text-sm mt-0.5">Gestioná roles y accesos a CFP y Terciario</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-sm font-bold border" style={{ borderColor: P.navy + "30", color: P.navy }}>
            {filtered.length} usuarios
          </span>
          {puedeAsignarRoles(currentUser) && (
            <button onClick={() => setNuevoModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold hover:opacity-80 transition-opacity"
              style={{ background: P.navy, color: P.yellow }}>
              + Nuevo usuario
            </button>
          )}
        </div>
      </div>
      {nuevoModal && <NuevoUsuarioModal onClose={() => setNuevoModal(false)} onSaved={fetchUsers} />}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1a1f4e]/40" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, usuario o email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#b8ccd8] bg-white text-[#1a1f4e] text-sm focus:outline-none focus:ring-2 focus:ring-[#f5c518]" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "terciario", label: "Con acceso Terciario" },
            { key: "ambos", label: "CFP + Terciario" },
            { key: "todos", label: "Todos los usuarios" },
          ].map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${filtro === f.key ? "text-[#1a1f4e] border-[#f5c518]" : "border-[#b8ccd8] text-[#1a1f4e]/60 hover:border-[#1a1f4e]/40"}`}
              style={filtro === f.key ? { background: P.yellow } : { background: "white" }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-[#1a1f4e]/40 text-sm">Cargando...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#b8ccd8] bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: P.navy }} className="text-[#b8ccd8] text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-bold">Usuario</th>
                <th className="px-4 py-3 text-left font-bold">Nombre</th>
                <th className="px-4 py-3 text-left font-bold">Grupos</th>
                <th className="px-4 py-3 text-left font-bold">Acceso</th>
                <th className="px-4 py-3 text-left font-bold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#b8ccd8]/30">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-[#b8ccd8]/10 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#1a1f4e]">{u.username}</p>
                    <p className="text-xs text-[#1a1f4e]/50">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-[#1a1f4e]/80">
                    {u.last_name} {u.first_name}
                    {(u.is_superuser || u.is_staff) && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">SuperAdmin</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.groups.length === 0
                        ? <span className="text-[#1a1f4e]/30 text-xs">—</span>
                        : u.groups.map(g => <GrupoBadge key={g} nombre={g} />)
                      }
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      <AccesoBadge tieneAcceso={tieneAccesoCFP(u)} sistema="CFP" />
                      <AccesoBadge tieneAcceso={tieneAccesoTerciario(u)} sistema="Terciario" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {puedeAsignarRoles(currentUser) && (
                        <button onClick={() => setEditUser(u)} title="Editar grupos"
                          className="p-1.5 rounded-lg hover:bg-[#1a1f4e]/10 text-[#1a1f4e]/50 hover:text-[#1a1f4e] transition-colors">
                          <Pencil size={14} />
                        </button>
                      )}
                      <button onClick={() => resetPassword(u)} title="Regenerar contraseña"
                        disabled={resettingId === u.id}
                        className="p-1.5 rounded-lg hover:bg-[#1a1f4e]/10 text-[#1a1f4e]/50 hover:text-[#1a1f4e] transition-colors disabled:opacity-40">
                        <RefreshCw size={14} className={resettingId === u.id ? "animate-spin" : ""} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-[#1a1f4e]/40 text-sm">No hay usuarios que coincidan.</div>
          )}
        </div>
      )}

      {editUser && (
        <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSaved={() => { fetchUsers(); setEditUser(null); }} />
      )}
    </div>
  );
}
