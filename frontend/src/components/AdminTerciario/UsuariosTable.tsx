import React from "react";
import { Pencil, RefreshCw } from "lucide-react";
import { P } from "./AdminUI";
import { User, UserDetails } from "../../api/types";
import {
  GrupoBadge,
  AccesoBadge,
  tieneAccesoCFP,
  tieneAccesoTerciario,
  puedeAsignarRoles
} from "./UsuariosPanel";

interface UsuariosTableProps {
  rows: User[];
  isLoading: boolean;
  currentUser: UserDetails | null;
  resettingId: number | null;
  onEdit: (user: User) => void;
  onResetPassword: (user: User) => void;
}

export function UsuariosTable({
  rows,
  isLoading,
  currentUser,
  resettingId,
  onEdit,
  onResetPassword,
}: UsuariosTableProps) {
  return (
    <>
      {isLoading ? (
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
              {rows.map((u: User) => (
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
                      {!u.groups || u.groups.length === 0
                        ? <span className="text-[#1a1f4e]/30 text-xs">—</span>
                        : u.groups.map((g: string) => <GrupoBadge key={g} nombre={g} />)
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
                        <button onClick={() => onEdit(u)} title="Editar grupos"
                          className="p-1.5 rounded-lg hover:bg-[#1a1f4e]/10 text-[#1a1f4e]/50 hover:text-[#1a1f4e] transition-colors">
                          <Pencil size={14} />
                        </button>
                      )}
                      <button onClick={() => onResetPassword(u)} title="Regenerar contraseña"
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
          {rows.length === 0 && (
            <div className="text-center py-12 text-[#1a1f4e]/40 text-sm">No hay usuarios que coincidan.</div>
          )}
        </div>
      )}
    </>
  );
}
