import React, { useState, useEffect, useCallback } from "react";
import { Search, X, Save, Pencil, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { apiClientV2 } from "../../api/client";
import { P } from "./AdminUI";
import { User, UserDetails } from "../../api/types";
import { EditUserModal } from "./EditUserModal";
import { NuevoUsuarioModal } from "./NuevoUsuarioModal";
import { UsuariosTable } from "./UsuariosTable";
import { UsuariosFilters } from "./UsuariosFilters";

// Grupos que dan acceso a CFP (tener cualquiera de estos = puede entrar al panel CFP)
export const GRUPOS_CFP = ["Admin", "Secretaría", "Regencia", "Coordinación Docente", "Docente", "Preceptor", "Bedel", "Rector"];
// Grupos que dan acceso a Terciario (Admin/Rector siempre tienen ambos; "Terciario" es el flag para el resto)
export const GRUPOS_TERCIARIO = ["Admin", "Terciario", "Rector"];

// Roles funcionales (definen qué puede hacer el usuario, sin determinar el sistema por sí solos)
export const ROLES_FUNCIONALES = [
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

export interface GrupoBadgeProps {
  nombre: string;
}

export function GrupoBadge({ nombre }: GrupoBadgeProps) {
  const cfg = GRUPOS_CONFIG.find(g => g.nombre === nombre);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg?.color || "bg-gray-100 text-gray-600"}`}>
      {nombre}
    </span>
  );
}

export interface AccesoBadgeProps {
  tieneAcceso: boolean;
  sistema: string;
}

export function AccesoBadge({ tieneAcceso, sistema }: AccesoBadgeProps) {
  return tieneAcceso
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700"><CheckCircle2 size={10} />{sistema}</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-400"><XCircle size={10} />{sistema}</span>;
}

export function tieneAccesoCFP(user: User | UserDetails) {
  return !!(user.is_superuser || user.is_staff || (user.groups && user.groups.some(g => GRUPOS_CFP.includes(g)) && !user.groups.includes("Sin CFP")));
}
export function tieneAccesoTerciario(user: User | UserDetails) {
  return !!(user.is_superuser || user.is_staff || (user.groups && user.groups.some(g => GRUPOS_TERCIARIO.includes(g))));
}

export function derivarEstado(grupos: string[], is_superuser: boolean) {
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

export function construirGrupos(rol: string, accCFP: boolean, accTerciario: boolean, is_superuser: boolean): string[] {
  if (is_superuser) return [];
  const grupos: string[] = [];

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

export interface RolYAccesoFormProps {
  grupos: string[];
  is_superuser: boolean;
  onChange: (grupos: string[]) => void;
}

export function RolYAccesoForm({ grupos, is_superuser, onChange }: RolYAccesoFormProps) {
  const { rolActual: derivedRol, accCFP, accTerciario } = derivarEstado(grupos, is_superuser);
  const [rolActual, setRolActual] = useState<string>(derivedRol || "");

  useEffect(() => {
    if (derivedRol) setRolActual(derivedRol);
  }, [derivedRol]);

  const setRol = (nuevoRol: string) => {
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

  const toggleAcceso = (sistema: string) => {
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

export const GRUPOS_PUEDEN_ASIGNAR = ["Admin", "Rector", "Regencia", "Secretaría"];

export function puedeAsignarRoles(currentUser: User | UserDetails | null) {
  if (!currentUser) return false;
  if (currentUser.is_superuser || currentUser.is_staff) return true;
  return (currentUser.groups || []).some(g => GRUPOS_PUEDEN_ASIGNAR.includes(g));
}

export function UsuariosPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [filtro, setFiltro] = useState<string>("todos"); 
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resettingId, setResettingId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<UserDetails | null>(null);
  const [nuevoModal, setNuevoModal] = useState<boolean>(false);

  useEffect(() => {
    apiClientV2.get<UserDetails>("/user").then(({ data }) => setCurrentUser(data)).catch(() => {});
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClientV2.get<User[]>("/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: unknown) { setUsers([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const resetPassword = async (u: User) => {
    if (!window.confirm(`¿Regenerar contraseña para ${u.username}? Se enviará al email.`)) return;
    setResettingId(u.id);
    try {
      await apiClientV2.post(`/users/${u.id}/regenerate-password`);
    } catch (err: unknown) {}
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

      <UsuariosFilters
        search={search}
        onSearchChange={setSearch}
        filtro={filtro}
        onFiltroChange={setFiltro}
      />

      <UsuariosTable
        rows={filtered}
        isLoading={loading}
        currentUser={currentUser}
        resettingId={resettingId}
        onEdit={setEditUser}
        onResetPassword={resetPassword}
      />

      {editUser && (
        <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSaved={() => { fetchUsers(); setEditUser(null); }} />
      )}
    </div>
  );
}
