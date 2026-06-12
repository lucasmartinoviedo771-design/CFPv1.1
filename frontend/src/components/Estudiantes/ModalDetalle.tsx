import React, { useMemo } from "react";
import { Modal } from "./Modal";
import { Button, Card } from "../UI";
import { SectionDivider } from "../../pages/Estudiantes";
import {
    Download, X, AlertCircle, Check, Eye, User, Baby, Cpu, Send, Briefcase, FileText
} from 'lucide-react';
import { getMediaUrl } from '../../utils/media';
import { formatDateDisplay, formatDateTimeDisplay } from '../../utils/dateFormat';
import { apiClientV2 } from '../../api/client';
import type { Inscripcion, Nota, Modulo } from "../../api/types";
import type { ViewDataState } from "../../pages/Estudiantes";

interface ModalDetalleProps {
    isOpen: boolean;
    studentId: number | null;
    viewData: ViewDataState;
    onClose: () => void;
    onRefresh: () => void;
    onOpenRespuestas: () => void;
    onOpenQR: (url: string, name: string) => void;
    setFeedback: (fb: { open: boolean; message: string; severity: "success" | "warning" | "error" }) => void;
}

export const ModalDetalle: React.FC<ModalDetalleProps> = ({
    isOpen,
    studentId,
    viewData,
    onClose,
    onRefresh,
    onOpenQR,
    onOpenRespuestas,
    setFeedback
}) => {
    const student = viewData.student;

    const trayectoria = useMemo(() => {
        const inscripciones = viewData.inscripciones || [];
        const notas = viewData.notas || [];

        const inscripcionesActivas = inscripciones.filter(i => i.estado === "CURSANDO");
        interface MapValue extends Modulo {
            _programa_nombre?: string | null;
            _bloque_nombre?: string | null;
        }
        const modulosMap = new Map<number, MapValue>();
        inscripcionesActivas.forEach(i => {
            if (i?.modulo?.id && !modulosMap.has(i.modulo.id)) {
                modulosMap.set(i.modulo.id, {
                    ...i.modulo,
                    _programa_nombre: i?.cohorte?.programa?.nombre,
                    _bloque_nombre: i?.modulo?.bloque?.nombre || i?.cohorte?.bloque_fechas?.nombre
                });
            }
        });
        const modulosInscriptos = Array.from(modulosMap.values());

        const modulosAprobadosIds = new Set(
            notas
                .filter(n => n.aprobado && n.examen_modulo_id)
                .map(n => n.examen_modulo_id)
        );

        const modulosAprobados = modulosInscriptos.filter(m => modulosAprobadosIds.has(m.id));
        const modulosPendientes = modulosInscriptos.filter(m => !modulosAprobadosIds.has(m.id));

        return {
            inscripcionesActivas,
            modulosAprobados,
            modulosPendientes,
            notasAprobadas: notas.filter(n => n.aprobado),
        };
    }, [viewData.inscripciones, viewData.notas]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={student ? `Detalle: ${student.apellido}, ${student.nombre} ` : "Detalle del Estudiante"}
            maxWidthClass="max-w-5xl"
            actions={<Button variant="ghost" onClick={onClose}>Cerrar</Button>}
        >
            {viewData.loading && <p className="text-indigo-200">Cargando detalle...</p>}
            {!!viewData.error && <p className="text-red-300">{viewData.error}</p>}

            {!viewData.loading && !viewData.error && student && (
                <div className="space-y-6">
                    <div>
                        <SectionDivider title="Datos Personales" icon={User} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <p><span className="text-indigo-300">DNI:</span> {student.dni || "-"}</p>
                            <p><span className="text-indigo-300">CUIT:</span> {student.cuit || "-"}</p>
                            <p><span className="text-indigo-300">Email:</span> {student.email || "-"}</p>
                            <p><span className="text-indigo-300">Sexo:</span> {student.sexo || "-"}</p>
                            <p><span className="text-indigo-300">Fecha Nacimiento:</span> {formatDateDisplay(student.fecha_nacimiento)}</p>
                            <p><span className="text-indigo-300">Estatus:</span> {student.estatus || "-"}</p>
                            <p><span className="text-indigo-300">País Nacimiento:</span> {student.pais_nacimiento || "-"}</p>
                            <p><span className="text-indigo-300">Nacionalidad:</span> {student.nacionalidad || "-"}</p>
                            <p><span className="text-indigo-300">Lugar Nacimiento:</span> {student.lugar_nacimiento || "-"}</p>
                            <p><span className="text-indigo-300">Domicilio:</span> {student.domicilio || "-"}</p>
                            <p><span className="text-indigo-300">Ciudad:</span> {student.ciudad || "-"}</p>
                            <p><span className="text-indigo-300">Barrio:</span> {student.barrio || "-"}</p>
                            <p><span className="text-indigo-300">Teléfono:</span> {student.telefono || "-"}</p>
                            <p><span className="text-indigo-300">Nivel Educativo:</span> {student.nivel_educativo || "-"}</p>
                            <p><span className="text-indigo-300">Lugar de trabajo:</span> {student.lugar_trabajo || "-"}</p>
                        </div>

                        <SectionDivider title="Documentación" icon={FileText} />
                        <div className="flex gap-4">
                            {student.dni_digitalizado ? (
                                <a
                                    href={getMediaUrl(student.dni_digitalizado)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/40 px-4 py-2 rounded-lg text-cyan-300 transition-all border border-cyan-500/30"
                                >
                                    <Download size={18} /> Ver DNI Digitalizado
                                </a>
                            ) : (
                                <div className="flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-lg text-red-400 border border-red-500/20">
                                    <X size={18} /> DNI no disponible
                                </div>
                            )}

                            {student.titulo_secundario_digitalizado ? (
                                <a
                                    href={getMediaUrl(student.titulo_secundario_digitalizado)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/40 px-4 py-2 rounded-lg text-emerald-300 transition-all border border-emerald-500/30"
                                >
                                    <Download size={18} /> Ver Título Secundario
                                </a>
                            ) : (
                                <div className="flex items-center gap-2 bg-indigo-900/40 px-4 py-2 rounded-lg text-gray-500 border border-white/10">
                                    <X size={18} /> Título no disponible
                                </div>
                            )}
                        </div>

                        {(() => {
                            const hoy = new Date();
                            const nac = student.fecha_nacimiento ? new Date(student.fecha_nacimiento) : null;
                            let edad = 18;
                            if (nac) {
                                edad = hoy.getFullYear() - nac.getFullYear();
                                const mm = hoy.getMonth() - nac.getMonth();
                                if (mm < 0 || (mm === 0 && hoy.getDate() < nac.getDate())) edad--;
                            }
                            if (edad >= 18) return null;

                            return (
                                <>
                                    <SectionDivider title="Información del Padre/Madre o Tutor (Menor de Edad)" icon={User} />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-4">
                                        <p><span className="text-indigo-300">Responsable:</span> <span className="text-white font-bold">{student.tutor_nombre || "No cargado"}</span></p>
                                        <p><span className="text-indigo-300">DNI Responsable:</span> <span className="text-white font-bold">{student.tutor_dni || "No cargado"}</span></p>
                                        <p><span className="text-indigo-300">WhatsApp Tutor:</span> <span className="text-emerald-400 font-bold">{student.tutor_telefono || "No cargado"}</span></p>
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex flex-col gap-2">
                                            {student.dni_tutor_digitalizado ? (
                                                <a
                                                    href={getMediaUrl(student.dni_tutor_digitalizado)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 px-4 py-2 rounded-lg text-orange-300 transition-all border border-orange-500/30"
                                                >
                                                    <Download size={18} /> Ver DNI del Padre/Madre o Tutor
                                                </a>
                                            ) : (
                                                <div className="flex items-center gap-2 bg-orange-900/20 px-4 py-2 rounded-lg text-orange-400/50 border border-orange-500/10 italic text-xs">
                                                    DNI Padre/Madre o Tutor pendiente
                                                </div>
                                            )}
                                            <label className="cursor-pointer bg-orange-600/80 hover:bg-orange-500 text-white text-[10px] px-3 py-1.5 rounded-full text-center transition-all flex items-center justify-center gap-1">
                                                <Download size={12} className="rotate-180" /> {student.dni_tutor_digitalizado ? "REEMPLAZAR DNI TUTOR" : "SUBIR DNI TUTOR"}
                                                <input
                                                    type="file"
                                                    accept="image/*,application/pdf"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const f = e.target.files?.[0];
                                                        if (!f) return;
                                                        try {
                                                            const fd = new FormData();
                                                            fd.append('dni_tutor_digitalizado', f);
                                                            await apiClientV2.post(`/estudiantes/${student.id}/documentos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                                                            setFeedback({ open: true, message: "DNI del tutor actualizado correctamente.", severity: "success" });
                                                            onRefresh();
                                                        } catch {
                                                            setFeedback({ open: true, message: "Error al subir el DNI.", severity: "error" });
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>

                                        {student.nota_parental_firmada ? (
                                            <a
                                                href={getMediaUrl(student.nota_parental_firmada)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 rounded-lg text-emerald-300 transition-all border border-emerald-500/30"
                                            >
                                                <Check size={18} /> Autorización Parental OK
                                            </a>
                                        ) : (
                                            <div className="flex items-center gap-2 bg-red-900/20 px-4 py-2 rounded-lg text-red-300 border border-red-500/20 italic text-xs">
                                                <AlertCircle size={14} /> Falta Autorización Firmada
                                            </div>
                                        )}

                                        {student.autorizacion_status === 'DIGITAL' && (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex flex-col gap-1 items-center bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20 text-xs shadow-sm">
                                                    <span className="text-emerald-400 font-bold flex items-center gap-2">
                                                        <Check size={14} /> Firma Digital Validada
                                                    </span>
                                                    <span className="text-[10px] text-emerald-300 opacity-80">
                                                        {formatDateTimeDisplay(student.autorizacion_fecha)}
                                                    </span>
                                                </div>
                                                {student.autorizacion_selfie && (
                                                    <a
                                                        href={getMediaUrl(student.autorizacion_selfie)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] px-3 py-1.5 rounded-full transition-all"
                                                    >
                                                        <Eye size={12} /> VER SELFIE DE FIRMA
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        {student.autorizacion_status === 'PENDIENTE' && (
                                            <div className="flex flex-col gap-2 p-3 bg-indigo-950/50 border border-indigo-500/20 rounded-xl">
                                                <p className="text-[10px] font-bold text-indigo-300 uppercase mb-1">Firma Presencial</p>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={async () => {
                                                            let token = student.autorizacion_token;
                                                            if (!token) {
                                                                const { data } = await apiClientV2.post<{ token: string }>(`/autorizaciones/generate/${student.id}`);
                                                                token = data.token;
                                                            }
                                                            const url = `https://politecnico.ar/cfp/autorizar.html?token=${token}`;
                                                            window.open(url, '_blank');
                                                        }}
                                                        className="text-[10px] py-1 h-auto"
                                                        title="Abrir en este dispositivo"
                                                    >
                                                        Abrir Link
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={async () => {
                                                            let token = student.autorizacion_token;
                                                            if (!token) {
                                                                const { data } = await apiClientV2.post<{ token: string }>(`/autorizaciones/generate/${student.id}`);
                                                                token = data.token;
                                                            }
                                                            const url = `https://politecnico.ar/cfp/autorizar.html?token=${token}`;
                                                            onOpenQR(url, `${student.nombre} ${student.apellido}`);
                                                        }}
                                                        className="text-[10px] py-1 h-auto"
                                                    >
                                                        Generar QR / Link
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                    </div >

                    {/* Nivelación Digital */}
                    {viewData.inscripciones.some(i => (i?.cohorte?.programa?.nombre || "").toLowerCase().includes("habilidades digitales")) && (
                        <div className="mx-6 mb-8 p-5 bg-brand-accent/5 border border-brand-accent/20 rounded-2xl backdrop-blur-md animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-brand-accent/20 rounded-xl">
                                        <Cpu className="text-brand-accent" size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white tracking-tight">Nivelación: Habilidades Digitales</h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            {student.nivelacion_digital ? (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${student.nivelacion_digital.completado ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                            {student.nivelacion_digital.completado ? `Completado: ${student.nivelacion_digital.puntaje}/10` : 'Enviado / Pendiente'}
                                                        </span>
                                                        {student.nivelacion_digital.completado && (
                                                            <span className="text-xs font-medium text-indigo-300">
                                                                Asignación final: <span className={student.nivelacion_digital.puntaje >= 7 && !student.nivelacion_digital.respuestas_json?.wants_module1 ? 'text-emerald-400' : 'text-amber-400'}>
                                                                    {student.nivelacion_digital.puntaje >= 7 && !student.nivelacion_digital.respuestas_json?.wants_module1 ? 'Módulo 2 (Virtual)' : 'Módulo 1 (Presencial)'}
                                                                </span>
                                                            </span>
                                                        )}
                                                    </div>
                                                    {student.nivelacion_digital.completado && student.nivelacion_digital.respuestas_json?.wants_module1 && (
                                                        <span className="text-[10px] text-orange-300 italic">
                                                            * El estudiante eligió cursar el Módulo 1 presencial a pesar de su puntaje.
                                                        </span>
                                                    )}
                                                    {student.nivelacion_digital.completado && (
                                                        <Button
                                                            onClick={onOpenRespuestas}
                                                            className="bg-indigo-600/30 hover:bg-indigo-500/50 border border-indigo-500/50 text-xs py-1 mt-1 w-max"
                                                        >
                                                            Ver Cuestionario
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-indigo-300">Test pendiente de envío</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {!student.nivelacion_digital?.completado && (
                                    <Button
                                        onClick={async () => {
                                            try {
                                                const { data } = await apiClientV2.post<{ token: string }>(`/nivelacion/generate/${student.id}`);
                                                const url = `https://politecnico.ar/cfp/nivelacion.html?token=${data.token}`;
                                                onOpenQR(url, `${student.nombre} ${student.apellido} (Test Nivelación)`);
                                            } catch {
                                                alert("Error al generar el test.");
                                            }
                                        }}
                                        className="bg-brand-accent hover:bg-orange-600 border-none shadow-lg shadow-brand-accent/20"
                                        startIcon={<Send size={16} />}
                                    >
                                        Generar Invitación
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    <div>
                        <SectionDivider title="Trayectoria Académica" icon={Briefcase} />
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-3">
                                <p className="text-xs text-indigo-300">Inscripciones activas</p>
                                <p className="text-xl font-bold text-white">{trayectoria.inscripcionesActivas.length}</p>
                            </div>
                            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-3">
                                <p className="text-xs text-indigo-300">Módulos aprobados</p>
                                <p className="text-xl font-bold text-green-400">{trayectoria.modulosAprobados.length}</p>
                            </div>
                            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-3">
                                <p className="text-xs text-indigo-300">Módulos pendientes</p>
                                <p className="text-xl font-bold text-amber-300">{trayectoria.modulosPendientes.length}</p>
                            </div>
                            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-3">
                                <p className="text-xs text-indigo-300">Notas aprobadas</p>
                                <p className="text-xl font-bold text-cyan-300">{trayectoria.notasAprobadas.length}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="bg-indigo-950/30 border-indigo-500/20">
                                <h4 className="text-white font-semibold mb-2">Inscripciones</h4>
                                <div className="space-y-2 text-sm">
                                    {viewData.inscripciones.length ? viewData.inscripciones.map(i => (
                                        <div key={i.id} className="border-b border-indigo-500/10 pb-3 mb-2 last:border-0 last:mb-0">
                                            <div className="flex flex-col">
                                                <p className="text-indigo-100 font-bold">{i?.cohorte?.programa?.nombre || "Programa"}</p>
                                                <p className="text-indigo-300 text-xs">{i?.modulo?.bloque?.nombre || i?.cohorte?.bloque_fechas?.nombre || "-"}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-200 text-[10px] border border-indigo-500/20">
                                                        {i?.modulo?.nombre || "Inscripción"}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider ${i.estado === 'APROBADO' ? 'bg-green-500/20 text-green-400' :
                                                        i.estado === 'CURSANDO' ? 'bg-blue-500/20 text-blue-400' :
                                                            i.estado === 'PAUSADO' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                'bg-red-500/20 text-red-400'
                                                        }`}>
                                                        {i.estado}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )) : <p className="text-indigo-500/50 italic text-center py-4">Sin inscripciones registradas.</p>}
                                </div>
                            </Card>

                            <Card className="bg-indigo-950/30 border-indigo-500/20">
                                <h4 className="text-white font-semibold mb-2">Qué le falta aprobar</h4>
                                <div className="space-y-2 text-sm">
                                    {trayectoria.modulosPendientes.length ? trayectoria.modulosPendientes.map(m => (
                                        <div key={m.id} className="border-b border-indigo-500/10 pb-1 mb-1">
                                            <p className="text-indigo-300 text-xs">{m._programa_nombre || "Programa"} - {m._bloque_nombre || "Bloque"}</p>
                                            <p className="text-amber-300">{m.nombre}</p>
                                        </div>
                                    )) : <p className="text-green-300">No tiene módulos pendientes en sus inscripciones activas.</p>}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};
