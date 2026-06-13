import React, { useState, useMemo } from "react";
import { X, ShieldAlert, CheckCircle2, Gamepad2, User, Smartphone, MapPin, Check, Laptop, Wifi, Briefcase, XCircle, FileText } from "lucide-react";
import { apiClientV2 } from "../../api/client";
import {
    PreinscripcionVJ,
    StateBadge,
    DetailRow,
    YesNoIcon,
    DocumentLink,
} from "./PreinscripcionesVJHelpers";

interface DetailModalProps {
    student: PreinscripcionVJ;
    onClose: () => void;
    onSave: () => void;
}

export function PreinscripcionesVJDetailModal({ student, onClose, onSave }: DetailModalProps) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleStatusChange = async (newEstado: string) => {
        setSaving(true);
        setError("");
        setSuccess("");
        try {
            await apiClientV2.patch(`/videojuegos/preinscripciones/${student.id}`, {
                estado: newEstado,
            });
            setSuccess(`Postulación ${newEstado === "aprobado" ? "aprobada" : "rechazada"} con éxito.`);
            setTimeout(() => {
                onSave();
            }, 1000);
        } catch (err) {
            console.error(err);
            setError("Ocurrió un error al actualizar el estado de la postulación.");
        } finally {
            setSaving(false);
        }
    };

    const edad = useMemo(() => {
        if (!student.fecha_nacimiento) return null;
        try {
            const nac = new Date(student.fecha_nacimiento);
            const hoy = new Date();
            let e = hoy.getFullYear() - nac.getFullYear();
            const m = hoy.getMonth() - nac.getMonth();
            if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
            return e;
        } catch {
            return null;
        }
    }, [student.fecha_nacimiento]);

    const esMenor = edad !== null && edad < 18;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300">
            <div className="bg-[#0c122c] border border-indigo-500/20 rounded-[2.5rem] w-full max-w-3xl my-8 shadow-2xl shadow-black relative overflow-hidden">
                {/* Background ambient light */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#00ccff]/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#FF6600]/10 rounded-full blur-2xl" />

                {/* Modal Header */}
                <div className="relative flex items-center justify-between p-8 border-b border-indigo-500/10">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black tracking-tight text-white">
                                {student.apellido}, {student.nombre}
                            </h2>
                            <StateBadge estado={student.estado_vj} />
                            {esMenor && (
                                <span className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-wider">
                                    Menor de Edad
                                </span>
                            )}
                        </div>
                        <p className="text-indigo-300 text-sm font-semibold mt-1">
                            DNI: {student.dni} · {student.email}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 rounded-2xl hover:bg-white/5 text-indigo-300 hover:text-white transition-all duration-300 active:scale-95 border border-indigo-500/10"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-950">
                    {error && (
                        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold flex items-center gap-2">
                            <ShieldAlert size={16} /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center gap-2">
                            <CheckCircle2 size={16} /> {success}
                        </div>
                    )}

                    {/* Trayecto / Bloques VJ */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#00ccff] border-b border-indigo-500/10 pb-2 flex items-center gap-2">
                            <Gamepad2 size={14} /> Especialidad Elegida
                        </h3>
                        <div className="flex flex-wrap gap-2.5">
                            {(student.bloques_vj || []).map((b: string, idx: number) => (
                                <span
                                    key={idx}
                                    className="px-4 py-2 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-xs font-black text-indigo-200 flex items-center gap-2"
                                >
                                    <Check size={12} className="text-[#00ccff]" />
                                    {b}
                                </span>
                            ))}
                            {(student.bloques_vj || []).length === 0 && (
                                <span className="text-sm text-indigo-400 italic">No se especificaron bloques.</span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personales */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#00ccff] border-b border-indigo-500/10 pb-2 flex items-center gap-2">
                                <User size={14} /> Datos Personales
                            </h3>
                            <div className="space-y-1">
                                <DetailRow
                                    label="Sexo"
                                    value={student.sexo === "M" ? "Masculino" : student.sexo === "F" ? "Femenino" : "Otro/X"}
                                />
                                <DetailRow label="Nacimiento" value={`${student.fecha_nacimiento} (${edad ? `${edad} años` : "—"})`} />
                                <DetailRow label="Nacionalidad" value={student.nacionalidad} />
                                <DetailRow label="Provincia Nac." value={student.lugar_nacimiento} />
                                <DetailRow label="CUIT" value={student.cuit} />
                                <DetailRow label="Nivel Educativo" value={student.nivel_educativo} />
                            </div>
                        </div>

                        {/* Domicilio / Contacto */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#00ccff] border-b border-indigo-500/10 pb-2 flex items-center gap-2">
                                <Smartphone size={14} /> Contacto & Residencia
                            </h3>
                            <div className="space-y-1">
                                <DetailRow label="Teléfono" value={student.telefono} icon={<Smartphone size={12} />} />
                                <DetailRow label="Ciudad" value={student.ciudad} icon={<MapPin size={12} />} />
                                <DetailRow label="Barrio" value={student.barrio} />
                                <DetailRow label="Domicilio" value={student.domicilio} />
                                <DetailRow label="Email" value={student.email} />
                            </div>
                        </div>
                    </div>

                    {/* PC, Internet y Trabajo */}
                    <div className="p-6 rounded-[2rem] bg-indigo-950/20 border border-indigo-500/10 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#00ccff] flex items-center gap-2">
                            <Laptop size={14} /> Recursos e Información Laboral
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="flex items-center justify-between p-3 rounded-2xl bg-black/20 border border-indigo-500/5">
                                <span className="text-xs font-bold text-indigo-300">Posee PC</span>
                                <YesNoIcon value={student.posee_pc} trueIcon={<Laptop size={14} />} falseIcon={<Laptop size={14} />} />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-2xl bg-black/20 border border-indigo-500/5">
                                <span className="text-xs font-bold text-indigo-300">Tiene Conectividad</span>
                                <YesNoIcon
                                    value={student.posee_conectividad}
                                    trueIcon={<Wifi size={14} />}
                                    falseIcon={<Wifi size={14} />}
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-2xl bg-black/20 border border-indigo-500/5">
                                <span className="text-xs font-bold text-indigo-300">Trabaja</span>
                                <YesNoIcon value={student.trabaja} trueIcon={<Briefcase size={14} />} falseIcon={<Briefcase size={14} />} />
                            </div>
                        </div>
                        {student.trabaja && student.lugar_trabajo && (
                            <div className="pt-2">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-400">Lugar de Trabajo</p>
                                <p className="text-sm font-semibold text-white/90 mt-1">{student.lugar_trabajo}</p>
                            </div>
                        )}
                    </div>

                    {/* Tutor info for minors */}
                    {esMenor && (
                        <div className="p-6 rounded-[2rem] bg-[#FF6600]/5 border border-[#FF6600]/25 space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#FF6600] flex items-center gap-2">
                                <ShieldAlert size={14} /> Tutor Responsable (Menor de Edad)
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Nombre</p>
                                    <p className="font-bold text-white mt-0.5">{student.tutor_nombre || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">DNI Tutor</p>
                                    <p className="font-bold text-white mt-0.5">{student.tutor_dni || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Teléfono Tutor</p>
                                    <p className="font-bold text-white mt-0.5">{student.tutor_telefono || "—"}</p>
                                </div>
                            </div>
                            {student.autorizacion_status && (
                                <div className="pt-2 border-t border-[#FF6600]/15 flex items-center gap-4 text-xs font-bold">
                                    <span className="text-indigo-300 uppercase tracking-wider">Estado Autorización Parental:</span>
                                    <span
                                        className={`px-2 py-0.5 rounded uppercase ${
                                            student.autorizacion_status === "SIGNED"
                                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                        }`}
                                    >
                                        {student.autorizacion_status === "SIGNED" ? "Firmada" : "Pendiente"}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Documentación */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#00ccff] border-b border-indigo-500/10 pb-2 flex items-center gap-2">
                            <FileText size={14} /> Documentos Adjuntos
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DocumentLink
                                url={student.dni_digitalizado}
                                label="Frente / Dorso DNI"
                                colorClass="border-cyan-500/20 bg-cyan-500/5 text-cyan-300 hover:border-cyan-500/40"
                            />
                            {!esMenor && (
                                <DocumentLink
                                    url={student.titulo_secundario_digitalizado}
                                    label="Título Secundario"
                                    colorClass="border-emerald-500/20 bg-emerald-500/5 text-emerald-300 hover:border-emerald-500/40"
                                />
                            )}
                            {esMenor && (
                                <DocumentLink
                                    url={student.dni_tutor_digitalizado}
                                    label="DNI Tutor"
                                    colorClass="border-orange-500/20 bg-orange-500/5 text-orange-200 hover:border-orange-500/40"
                                />
                            )}
                            {student.nota_parental_firmada && (
                                <DocumentLink
                                    url={student.nota_parental_firmada}
                                    label="Nota Parental Firmada"
                                    colorClass="border-emerald-500/20 bg-emerald-500/5 text-emerald-300 hover:border-emerald-500/40"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal Footer / Actions */}
                <div className="relative p-8 border-t border-indigo-500/10 flex flex-col sm:flex-row justify-end gap-3 bg-[#0a0d24]">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest transition-all duration-300 disabled:opacity-50"
                    >
                        Cerrar
                    </button>

                    {student.estado_vj === "pendiente" && (
                        <>
                            <button
                                onClick={() => handleStatusChange("rechazado")}
                                disabled={saving}
                                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/35 text-rose-400 hover:bg-rose-500/20 font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                                <XCircle size={15} /> Rechazar Postulación
                            </button>
                            <button
                                onClick={() => handleStatusChange("aprobado")}
                                disabled={saving}
                                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-orange-500 text-[#050814] font-black text-xs uppercase tracking-widest transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:scale-[1.02] flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                                <CheckCircle2 size={15} /> Aprobar Postulación
                            </button>
                        </>
                    )}

                    {student.estado_vj === "aprobado" && (
                        <button
                            onClick={() => handleStatusChange("rechazado")}
                            disabled={saving}
                            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/35 text-rose-400 hover:bg-rose-500/20 font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                            <XCircle size={15} /> Cambiar a Rechazado
                        </button>
                    )}

                    {student.estado_vj === "rechazado" && (
                        <button
                            onClick={() => handleStatusChange("aprobado")}
                            disabled={saving}
                            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-orange-500 text-[#050814] font-black text-xs uppercase tracking-widest transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:scale-[1.02] flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                            <CheckCircle2 size={15} /> Cambiar a Aprobado
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
