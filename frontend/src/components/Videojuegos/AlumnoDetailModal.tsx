import React, { useMemo } from "react";
import {
  X,
  Pencil,
  Gamepad2,
  User,
  Smartphone,
  MapPin,
  Laptop,
  Wifi,
  Briefcase,
  FileText
} from "lucide-react";
import {
  VideojuegosAlumnoDetail,
  ExtendedInscripcion,
  YesNoIcon,
  DetailRow,
  DocumentLink
} from "./AlumnosTab";

interface AlumnoDetailModalProps {
  student: VideojuegosAlumnoDetail;
  onClose: () => void;
  onEdit: () => void;
}

export function AlumnoDetailModal({ student, onClose, onEdit }: AlumnoDetailModalProps) {
  const edad = useMemo(() => {
    if (!student.fecha_nacimiento) return null;
    try {
      const nac = new Date(student.fecha_nacimiento);
      const hoy = new Date();
      let e = hoy.getFullYear() - nac.getFullYear();
      const m = hoy.getMonth() - nac.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
      return e;
    } catch { return null; }
  }, [student.fecha_nacimiento]);

  const esMenor = edad !== null && edad < 18;

  // Filtrar inscripciones del programa VJ
  const vjInscriptions = (student.inscripciones || []).filter(
    (ins) => ins.cohorte?.programa?.codigo === "VJ"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-[#0c122c] border border-indigo-500/20 rounded-[2.5rem] w-full max-w-3xl my-8 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="relative flex items-center justify-between p-8 border-b border-indigo-500/10">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-white">
                {student.apellido}, {student.nombre}
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                student.estatus === "Regular" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-indigo-950 text-indigo-300 border border-indigo-500/25"
              }`}>
                {student.estatus || "Preinscripto"}
              </span>
              {esMenor && (
                <span className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-black uppercase">
                  Menor de Edad
                </span>
              )}
            </div>
            <p className="text-indigo-300 text-sm font-semibold mt-1">
              DNI: {student.dni} · {student.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-3 rounded-2xl bg-[#00ccff]/10 hover:bg-[#00ccff]/20 text-[#00ccff] hover:text-white transition-all border border-[#00ccff]/20 active:scale-95"
              title="Editar legajo"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-3 rounded-2xl hover:bg-white/5 text-indigo-300 hover:text-white transition-all border border-indigo-500/10"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-950">
          {/* Cursando (Inscripciones de VJ) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#00ccff] border-b border-indigo-500/10 pb-2 flex items-center gap-2">
              <Gamepad2 size={14} /> Legajo Académico Videojuegos
            </h3>
            <div className="space-y-2">
              {vjInscriptions.map((ins: ExtendedInscripcion, idx: number) => {
                const bloqueNombre = ins.modulo?.bloque?.nombre || ins.cohorte?.bloque?.nombre || "General";
                const moduloNombre = ins.modulo?.nombre || "Trayecto Completo";
                return (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/10 text-xs">
                    <div>
                      <p className="font-bold text-white">{moduloNombre}</p>
                      <p className="text-[10px] text-indigo-300 uppercase mt-0.5">{bloqueNombre} · {ins.cohorte?.nombre}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded uppercase font-black tracking-wider text-[9px] ${
                      ins.estado === "CURSANDO" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-indigo-950 text-indigo-400 border border-indigo-500/10"
                    }`}>
                      {ins.estado}
                    </span>
                  </div>
                );
              })}
              {vjInscriptions.length === 0 && (
                <p className="text-sm text-indigo-400 italic">No registra inscripciones asociadas a VJ.</p>
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
                <DetailRow label="Sexo" value={student.sexo === "M" ? "Masculino" : student.sexo === "F" ? "Femenino" : "Otro/X"} />
                <DetailRow label="Nacimiento" value={`${student.fecha_nacimiento} (${edad ? `${edad} años` : "—"})`} />
                <DetailRow label="Nacionalidad" value={student.nacionalidad} />
                <DetailRow label="Provincia Nac." value={student.lugar_nacimiento} />
                <DetailRow label="CUIT" value={student.cuit} />
                <DetailRow label="Nivel Educativo" value={student.nivel_educativo} />
              </div>
            </div>

            {/* Domicilio */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#00ccff] border-b border-indigo-500/10 pb-2 flex items-center gap-2">
                <Smartphone size={14} /> Contacto & Domicilio
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

          {/* Computadora */}
          <div className="p-6 rounded-[2rem] bg-indigo-950/20 border border-indigo-500/10 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#00ccff] flex items-center gap-2">
              <Laptop size={14} /> Equipamiento y Empleo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-indigo-500/5">
                <span className="text-xs font-bold text-indigo-300">Posee PC</span>
                <YesNoIcon value={student.posee_pc} trueIcon={<Laptop size={14} />} falseIcon={<Laptop size={14} />} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-indigo-500/5">
                <span className="text-xs font-bold text-indigo-300">Conectividad</span>
                <YesNoIcon value={student.posee_conectividad} trueIcon={<Wifi size={14} />} falseIcon={<Wifi size={14} />} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-indigo-500/5">
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

          {/* Documentación */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#00ccff] border-b border-indigo-500/10 pb-2 flex items-center gap-2">
              <FileText size={14} /> Documentación Adjunta
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DocumentLink url={student.dni_digitalizado} label="DNI Digitalizado" colorClass="border-cyan-500/20 bg-cyan-500/5 text-cyan-300" />
              <DocumentLink url={student.titulo_secundario_digitalizado} label="Título Secundario" colorClass="border-emerald-500/20 bg-emerald-500/5 text-emerald-300" />
              {esMenor && <DocumentLink url={student.dni_tutor_digitalizado} label="DNI Tutor" colorClass="border-orange-500/20 bg-orange-500/5 text-orange-200" />}
              {student.nota_parental_firmada && <DocumentLink url={student.nota_parental_firmada} label="Nota Parental Firmada" colorClass="border-emerald-500/20 bg-emerald-500/5 text-emerald-300" />}
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-indigo-500/10 flex justify-end bg-[#0a0d24]">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
