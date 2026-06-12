import React, { useState } from "react";
import { X, BookCheck, AlertCircle } from "lucide-react";
import { apiClientV2 } from "../../api/client";
import { P, Section, Row, DocRow } from "./AdminUI";
import type { PreinscripcionTerciario } from "../../api/types";

const LOCALIDAD_LABELS: Record<string, string> = {
  ushuaia: "Ushuaia", rg_sur: "Río Grande Sur", rg_norte: "Río Grande Norte",
  tolhuin: "Tolhuin", zona_rural: "Zona Rural", otras: "Otras",
};
const SECUNDARIA_LABELS: Record<string, string> = { si: "Sí", no: "No", cursando: "Cursando" };
const HD_ESTADO_LABELS: Record<string, string> = { CURSANDO: "Cursando", APROBADO: "Aprobado", DESAPROBADO: "Desaprobado", INACTIVO: "Inactivo" };
const HD_ESTADO_COLORS: Record<string, string> = {
  CURSANDO: "bg-blue-100 text-blue-800", APROBADO: "bg-green-100 text-green-800",
  DESAPROBADO: "bg-red-100 text-red-800", INACTIVO: "bg-gray-100 text-gray-600",
};

interface YesNoProps {
  v?: boolean | null;
}

export function YesNo({ v }: YesNoProps) {
  if (v === true) return <span className="text-green-600 font-semibold text-xs">Sí</span>;
  if (v === false) return <span className="text-red-500 font-semibold text-xs">No</span>;
  return <span className="text-gray-400 text-xs">—</span>;
}

interface DetailModalProps {
  p: PreinscripcionTerciario;
  onClose: () => void;
  onSaved: () => void;
}

export function DetailModal({ p, onClose, onSaved }: DetailModalProps) {
  const [estado, setEstado] = useState<string>(p.estado);
  const [obs, setObs] = useState<string>(p.observaciones || "");
  const [saving, setSaving] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");
  const [urls, setUrls] = useState<{ dni: string | null | undefined; titulo: string | null | undefined }>({
    dni: p.url_dni,
    titulo: p.url_titulo
  });
  const [uploadingDoc, setUploadingDoc] = useState<boolean>(false);

  const handleDocUpload = async (field: string, file: File | undefined) => {
    if (!file) return;
    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append(field, file);
      const { data } = await apiClientV2.patch(
        `/preinscripciones-terciario/${p.id}/docs`, fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setUrls({ dni: data.url_dni, titulo: data.url_titulo });
      setMsg("Documento actualizado.");
    } catch { setMsg("Error al subir el documento."); }
    finally { setUploadingDoc(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      await apiClientV2.patch(`/preinscripciones-terciario/${p.id}`, null, { params: { estado, observaciones: obs } });
      setMsg("Guardado.");
      onSaved();
    } catch { setMsg("Error al guardar."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl my-8 shadow-2xl border border-[#b8ccd8]">
        <div className="flex items-center justify-between p-6 border-b border-[#b8ccd8]" style={{ background: P.navy }}>
          <div>
            <h2 className="text-lg font-black text-white">{p.apellido_nombre}</h2>
            <p className="text-[#f5c518] text-xs mt-0.5">DNI: {p.dni} · {p.email}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {p.hd_estado && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold ${HD_ESTADO_COLORS[p.hd_estado] || "bg-gray-100"}`}>
              <BookCheck size={18} /> Habilidades Digitales Módulo 2: {HD_ESTADO_LABELS[p.hd_estado] || p.hd_estado}
            </div>
          )}
          {!p.hd_estado && p.estado === "aprobada" && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-orange-200 bg-orange-50 text-orange-700 text-sm font-semibold">
              <AlertCircle size={18} /> HD Módulo 2: pendiente de inscripción
            </div>
          )}

          <Section title="Datos Personales">
            <Row label="Celular" value={p.celular} />
            <Row label="Sexo" value={p.sexo === "F" ? "Femenino" : p.sexo === "M" ? "Masculino" : "Otro"} />
            <Row label="Fecha nacimiento" value={p.fecha_nacimiento} />
            <Row label="Localidad nacimiento" value={p.localidad_nacimiento} />
            <Row label="Provincia nacimiento" value={p.provincia_nacimiento} />
            <Row label="Nacionalidad" value={p.nacionalidad} />
            <Row label="CUIL" value={p.cuil} />
            <Row label="Domicilio" value={p.domicilio} />
            <Row label="Localidad residencia" value={p.localidad ? (LOCALIDAD_LABELS[p.localidad] || p.localidad) : ""} />
          </Section>

          <Section title="Datos Académicos">
            <Row label="Finalizó secundaria" value={p.finalizo_secundaria ? (SECUNDARIA_LABELS[p.finalizo_secundaria] || p.finalizo_secundaria) : ""} />
            <Row label="Estudios superiores" value={<YesNo v={p.posee_estudios_superiores} />} />
            {p.posee_estudios_superiores && (
              <>
                <Row label="Finalizó superiores" value={<YesNo v={p.estudios_superiores_finalizado} />} />
                <Row label="Carrera" value={p.estudios_superiores_carrera} />
              </>
            )}
          </Section>

          <Section title="Datos Tecnológicos">
            <Row label="Posee PC/notebook" value={<YesNo v={p.posee_pc} />} />
            <Row label="Posee internet" value={<YesNo v={p.posee_internet} />} />
          </Section>

          <Section title="Datos Complementarios">
            <Row label="Pueblo originario" value={<YesNo v={p.pueblo_originario} />} />
            <Row label="Posee discapacidad" value={<YesNo v={p.posee_discapacidad} />} />
            {p.posee_discapacidad && (
              <>
                <Row label="Tipo discapacidad" value={p.tipo_discapacidad} />
                <Row label="Posee CUD" value={<YesNo v={p.posee_cud} />} />
                <Row label="Apoyo inclusión" value={p.apoyo_inclusion} />
                <Row label="Apoyo específico" value={<YesNo v={p.requiere_apoyo_especifico} />} />
                {p.requiere_apoyo_especifico && <Row label="Descripción apoyo" value={p.descripcion_apoyo} />}
              </>
            )}
          </Section>

          <Section title="Documentación">
            <DocRow label="DNI" url={urls.dni} field="dni_digitalizado" onUpload={handleDocUpload} uploading={uploadingDoc} />
            <DocRow label="Título Secundario" url={urls.titulo} field="titulo_digitalizado" onUpload={handleDocUpload} uploading={uploadingDoc} />
            {msg && msg.includes("Documento") && (
              <p className={`text-xs font-semibold ${msg.includes("Error") ? "text-red-500" : "text-green-600"}`}>{msg}</p>
            )}
          </Section>

          <Section title="Gestión">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-[#1a1f4e]/50 mb-1 block">Estado</label>
                <select value={estado} onChange={(e) => setEstado(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 border border-[#b8ccd8] text-[#1a1f4e] text-sm focus:outline-none focus:ring-2 focus:ring-[#f5c518]">
                  <option value="pendiente">Pendiente</option>
                  <option value="aprobada">Aprobada</option>
                  <option value="rechazada">Rechazada</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-[#1a1f4e]/50 mb-1 block">Observaciones</label>
                <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2}
                  className="w-full rounded-xl px-3 py-2 border border-[#b8ccd8] text-[#1a1f4e] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#f5c518]"
                  placeholder="Agregar observaciones..." />
              </div>
            </div>
            {msg && !msg.includes("Documento") && <p className={`text-xs font-semibold mt-1 ${msg.includes("Error") ? "text-red-500" : "text-green-600"}`}>{msg}</p>}
            <button onClick={save} disabled={saving}
              className="px-6 py-2 rounded-xl font-bold text-sm transition-colors disabled:opacity-60"
              style={{ background: P.navy, color: P.yellow }}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </Section>
        </div>
      </div>
    </div>
  );
}
