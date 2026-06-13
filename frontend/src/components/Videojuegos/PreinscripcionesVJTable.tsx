import React from "react";
import { Laptop, Wifi, Eye, Gamepad2 } from "lucide-react";
import { PreinscripcionVJ, StateBadge } from "./PreinscripcionesVJHelpers";

interface PreinscripcionesVJTableProps {
    rows: PreinscripcionVJ[];
    isLoading: boolean;
    onView: (student: PreinscripcionVJ) => void;
}

export const PreinscripcionesVJTable: React.FC<PreinscripcionesVJTableProps> = ({
    rows,
    isLoading,
    onView,
}) => {
    return (
        <div className="bg-[#0c122c]/20 border border-indigo-500/10 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 text-indigo-300 font-bold uppercase tracking-wider space-y-4">
                    <div className="animate-spin text-[#00ccff]">
                        <Gamepad2 size={40} />
                    </div>
                    <p className="text-xs">Cargando legajos de Videojuegos...</p>
                </div>
            ) : rows.length === 0 ? (
                <div className="text-center py-20 text-indigo-400 font-semibold text-sm">
                    No se encontraron preinscripciones con los filtros seleccionados.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-[#0c122c]/70 border-b border-indigo-500/10 text-indigo-300 text-xs font-black uppercase tracking-widest">
                                <th className="px-6 py-4.5">Aspirante</th>
                                <th className="px-6 py-4.5">Contacto</th>
                                <th className="px-6 py-4.5">Especialidad</th>
                                <th className="px-6 py-4.5 text-center">Recursos PC</th>
                                <th className="px-6 py-4.5">Estado</th>
                                <th className="px-6 py-4.5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-500/5 bg-transparent">
                            {rows.map((p) => {
                                const edad = p.fecha_nacimiento
                                    ? new Date().getFullYear() - new Date(p.fecha_nacimiento).getFullYear()
                                    : 18;
                                const esMenor = edad < 18;
                                return (
                                    <tr key={p.id} className="hover:bg-[#00ccff]/5 transition-all duration-300">
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <p className="font-bold text-white text-base">
                                                    {p.apellido}, {p.nombre}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-indigo-300 font-semibold">{p.email}</span>
                                                    {esMenor && (
                                                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-black uppercase">
                                                            Menor
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-0.5 font-semibold text-indigo-200">
                                                <p className="text-xs">DNI: {p.dni}</p>
                                                {p.telefono && <p className="text-xs text-indigo-300">Tel: {p.telefono}</p>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {(p.bloques_vj || []).map((b: string, idx: number) => (
                                                    <span key={idx} className="text-xs text-indigo-200 font-medium">
                                                        • {b}
                                                    </span>
                                                ))}
                                                {(p.bloques_vj || []).length === 0 && (
                                                    <span className="text-xs text-indigo-400 italic">Sin bloques</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-4">
                                                <div className="flex flex-col items-center">
                                                    <Laptop size={15} className={p.posee_pc ? "text-[#00ccff]" : "text-indigo-950"} />
                                                    <span className="text-[9px] font-bold text-indigo-400 mt-1 uppercase">PC</span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <Wifi size={15} className={p.posee_conectividad ? "text-[#00ccff]" : "text-indigo-950"} />
                                                    <span className="text-[9px] font-bold text-indigo-400 mt-1 uppercase">Wifi</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StateBadge estado={p.estado_vj} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => onView(p)}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-[#00ccff] hover:text-[#050814] text-[#00ccff] text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-95 border border-[#00ccff]/20 hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                                            >
                                                <Eye size={13} /> Detalle
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
