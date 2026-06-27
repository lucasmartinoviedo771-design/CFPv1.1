import React from "react";
import { createPortal } from "react-dom";
import { Card, Button } from '../UI';
import {
  XCircle, Search, FileText, Download, CheckCircle, UserCheck, Eye, AlertCircle, Loader
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getMediaUrl } from "../../utils/media";
import { Aspirante } from "./types";
import { formatDateDisplay } from "../../utils/dateFormat";
import type { Inscripcion } from "../../api/types";

interface SectionDividerProps {
  title: string;
  icon?: LucideIcon;
}

const SectionDivider: React.FC<SectionDividerProps> = ({ title, icon: Icon }) => (
  <div className="flex items-center gap-2 text-indigo-300 border-b border-indigo-500/20 pb-2 mb-4 mt-6">
    {Icon && <Icon size={16} />}
    <span className="text-sm font-bold uppercase tracking-wider">{title}</span>
  </div>
);

export interface AspiranteDetailModalProps {
  viewStudent: Aspirante | null;
  isLoadingDetail?: boolean;
  inscriptions?: Inscripcion[];
  onClose: () => void;
  onApprove: () => void;
}

export default function AspiranteDetailModal({
  viewStudent,
  isLoadingDetail = false,
  inscriptions = [],
  onClose,
  onApprove,
}: AspiranteDetailModalProps) {
  if (!viewStudent) return null;

  const hoy = new Date();
  const nac = viewStudent.fecha_nacimiento ? new Date(viewStudent.fecha_nacimiento) : null;
  let edad = 18;
  if (nac) {
    edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  }
  const esMenor = edad < 18;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/80 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-indigo-900/90 border-indigo-500/30 shadow-2xl relative animate-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-indigo-300 hover:text-white transition-colors"
        >
          <XCircle size={24} />
        </button>

        <div className="p-2">
          <h2 className="text-2xl font-bold text-white mb-1">
            {viewStudent.apellido}, {viewStudent.nombre}
          </h2>
          <p className="text-indigo-300 mb-6 font-mono">
            {viewStudent.dni}
            {esMenor && (
              <span className="ml-3 text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">
                MENOR DE EDAD
              </span>
            )}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <SectionDivider title="Datos Personales" icon={Search} />
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-indigo-400">Email:</span>{" "}
                  <span className="text-white">{viewStudent.email}</span>
                </p>
                <p>
                  <span className="text-indigo-400">Teléfono:</span>{" "}
                  <span className="text-white">{viewStudent.telefono || "-"}</span>
                </p>
                <p>
                  <span className="text-indigo-400">Fecha Nac.:</span>{" "}
                  <span className="text-white">{viewStudent.fecha_nacimiento || "-"}</span>
                </p>
                <p>
                  <span className="text-indigo-400">Domicilio:</span>{" "}
                  <span className="text-white">
                    {isLoadingDetail ? "Cargando..." : (viewStudent.domicilio || "-")}, {viewStudent.ciudad || "-"}
                  </span>
                </p>
              </div>

              <SectionDivider title="Trayectos Solicitados" icon={FileText} />
              {isLoadingDetail ? (
                <div className="text-center py-6 text-indigo-300 flex items-center justify-center gap-2">
                  <Loader className="animate-spin text-cyan-400" size={18} />
                  <span>Cargando trayectos...</span>
                </div>
              ) : inscriptions.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {inscriptions.map((i) => {
                    const progNom = i.cohorte?.programa?.nombre || "Sin Programa";
                    const bloqueNom = i.modulo?.nombre || i.cohorte?.bloque?.nombre || "";
                    const label = bloqueNom ? `${progNom} (${bloqueNom})` : progNom;
                    
                    let statusClass = "bg-gray-500/20 text-gray-300 border-gray-500/30";
                    if (i.estado === "PREINSCRIPTO") {
                      statusClass = "bg-amber-500/20 text-amber-300 border-amber-500/30";
                    } else if (i.estado === "CURSANDO") {
                      statusClass = "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
                    } else if (["EGRESADO", "APROBADO"].includes(i.estado)) {
                      statusClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
                    } else if (["INACTIVO", "LIBRE", "DESAPROBADO"].includes(i.estado)) {
                      statusClass = "bg-rose-500/20 text-rose-300 border-rose-500/30";
                    }

                    return (
                      <div
                        key={i.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/10 gap-2 hover:border-indigo-500/30 transition-colors"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-white truncate" title={label}>{label}</span>
                          <span className="text-[10px] text-indigo-400">
                            Inscripción: {formatDateDisplay(i.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center shrink-0">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase font-bold tracking-wider ${statusClass}`}>
                            {i.estado}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {viewStudent.trayectos?.map((t, idx) => (
                    <span
                      key={idx}
                      className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30 text-xs"
                    >
                      {t}
                    </span>
                  ))}
                  {(!viewStudent.trayectos || viewStudent.trayectos.length === 0) && (
                    <span className="text-xs text-gray-500">Sin trayectos registrados</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <SectionDivider title="Documentación" icon={Download} />
              {isLoadingDetail ? (
                <div className="text-center py-6 text-indigo-300 flex items-center justify-center gap-2">
                  <Loader className="animate-spin text-cyan-400" size={18} />
                  <span>Cargando documentos...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {viewStudent.dni_digitalizado ? (
                    <a
                      href={getMediaUrl(viewStudent.dni_digitalizado)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between bg-indigo-500/20 hover:bg-indigo-500/40 p-3 rounded-lg text-cyan-300 transition-all border border-cyan-500/30"
                    >
                      <span className="flex items-center gap-2">
                        <FileText size={18} /> DNI Digitalizado
                      </span>
                      <Download size={18} />
                    </a>
                  ) : (
                    <div className="p-3 rounded-lg border border-red-500/30 text-red-400 bg-red-900/20 text-sm">
                      DNI no cargado
                    </div>
                  )}

                  {viewStudent.titulo_secundario_digitalizado ? (
                    <a
                      href={getMediaUrl(viewStudent.titulo_secundario_digitalizado)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between bg-indigo-500/20 hover:bg-indigo-500/40 p-3 rounded-lg text-emerald-300 transition-all border border-emerald-500/30"
                    >
                      <span className="flex items-center gap-2">
                        <FileText size={18} /> Título Secundario
                      </span>
                      <Download size={18} />
                    </a>
                  ) : (
                    !esMenor && (
                      <div className="p-3 rounded-lg border border-white/10 text-gray-500 bg-white/5 text-sm">
                        Título no cargado
                      </div>
                    )
                  )}
                </div>
              )}

              {esMenor && (
                <>
                  <SectionDivider title="Datos del Tutor (Menor)" icon={UserCheck} />
                  {isLoadingDetail ? (
                    <div className="text-center py-6 text-orange-300 flex items-center justify-center gap-2">
                      <Loader className="animate-spin text-orange-400" size={18} />
                      <span>Cargando datos del tutor...</span>
                    </div>
                  ) : (
                    <div className="space-y-3 p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                      <p className="text-sm">
                        <span className="text-orange-300/70">Nombre:</span>{" "}
                        <span className="text-white font-bold">{viewStudent.tutor_nombre}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-orange-300/70">DNI:</span>{" "}
                        <span className="text-white font-bold">{viewStudent.tutor_dni}</span>
                      </p>

                      {viewStudent.dni_tutor_digitalizado ? (
                        <a
                          href={getMediaUrl(viewStudent.dni_tutor_digitalizado)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between bg-orange-500/20 hover:bg-orange-500/40 p-3 rounded-lg text-orange-200 transition-all border border-orange-500/30"
                        >
                          <span className="flex items-center gap-2">
                            <FileText size={18} /> DNI del Tutor
                          </span>
                          <Download size={18} />
                        </a>
                      ) : (
                        <div className="p-3 rounded-lg border border-red-500/30 text-red-300 bg-red-900/20 text-xs">
                          DNI Tutor no cargado
                        </div>
                      )}

                      <SectionDivider title="Autorización Parental" icon={UserCheck} />
                      {viewStudent.autorizacion_status === "DIGITAL" ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl">
                          <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm mb-2">
                            <CheckCircle size={16} className="text-emerald-400" /> Firma Digital Validada
                          </div>
                          <div className="text-[10px] text-emerald-400/70 mb-3">
                            {viewStudent.autorizacion_fecha &&
                              new Date(viewStudent.autorizacion_fecha).toLocaleString()}
                          </div>
                          <a
                            href={getMediaUrl(viewStudent.autorizacion_selfie || "")}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded-md text-center font-semibold flex items-center justify-center gap-1 transition-all"
                          >
                            <Eye size={14} /> VER SELFIE DE FIRMA
                          </a>
                        </div>
                      ) : viewStudent.nota_parental_firmada ? (
                        <a
                          href={getMediaUrl(viewStudent.nota_parental_firmada)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between bg-emerald-500/20 hover:bg-emerald-500/40 p-3 rounded-lg text-emerald-300 transition-all border border-emerald-500/30"
                        >
                          <span className="flex items-center gap-2">
                            <CheckCircle size={18} /> Nota Autorización OK
                          </span>
                          <Download size={18} />
                        </a>
                      ) : (
                        <div className="p-3 rounded-lg border border-dashed border-red-500/50 text-red-300 text-center text-xs">
                          Esperando recepción de firma digital
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <SectionDivider title="Información Adicional" icon={AlertCircle} />
          {isLoadingDetail ? (
            <div className="text-center py-4 text-indigo-300 flex items-center justify-center gap-2">
              <Loader className="animate-spin text-cyan-400" size={16} />
              <span>Cargando detalles...</span>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-indigo-200">
              <p>Posee PC: {viewStudent.posee_pc ? "Sí" : "No"}</p>
              <p>Conectividad: {viewStudent.posee_conectividad ? "Sí" : "No"}</p>
              <p>Trabaja: {viewStudent.trabaja ? "Sí" : "No"}</p>
              <p>Nivel Educativo: {viewStudent.nivel_educativo || "-"}</p>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end gap-3 p-4 border-t border-indigo-500/20">
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={onApprove}>
            Aprobar Estudiante
          </Button>
        </div>
      </Card>
    </div>,
    document.body
  );
}
