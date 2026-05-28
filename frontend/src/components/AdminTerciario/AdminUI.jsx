import React from "react";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

export const P = { navy: "#1a1f4e", yellow: "#f5c518", blue: "#b8ccd8", gray: "#c8c4bc" };

export const BADGE = {
  pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  aprobada: "bg-green-100 text-green-800 border-green-200",
  rechazada: "bg-red-100 text-red-800 border-red-200",
};

export const BADGE_ICON = {
  pendiente: <Clock size={11} />, aprobada: <CheckCircle2 size={11} />, rechazada: <XCircle size={11} />,
};

export function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#b8ccd8]/50 flex items-center gap-4">
      <div className="p-3 rounded-xl flex-shrink-0" style={{ background: color + "20" }}>
        {React.cloneElement(icon, { size: 22, color })}
      </div>
      <div>
        <p className="text-2xl font-black text-[#1a1f4e]">{value}</p>
        <p className="text-xs text-[#1a1f4e]/60 font-medium">{label}</p>
      </div>
    </div>
  );
}

export function Badge({ estado }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${BADGE[estado] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {BADGE_ICON[estado]} {estado?.charAt(0).toUpperCase() + estado?.slice(1)}
    </span>
  );
}

export function YesNo({ v }) {
  if (v === true) return <span className="text-green-600 font-semibold text-xs">Sí</span>;
  if (v === false) return <span className="text-red-500 font-semibold text-xs">No</span>;
  return <span className="text-gray-400 text-xs">—</span>;
}

export function Row({ label, value }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="font-bold text-[#1a1f4e]/50 text-xs uppercase tracking-wide w-44 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-[#1a1f4e]">{value ?? "—"}</span>
    </div>
  );
}

export function DocRow({ label, url, field, onUpload, uploading }) {
  const ref = React.useRef();
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <span className="font-bold text-[#1a1f4e]/50 text-xs uppercase tracking-wide w-44 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 flex-wrap">
        {url
          ? <a href={url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-80 transition-opacity"
              style={{ background: "#1a1f4e" }}>
              Ver / Descargar
            </a>
          : <span className="text-red-400 text-xs font-semibold">No adjuntado</span>
        }
        <label className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border-2 border-dashed border-[#b8ccd8] hover:border-[#f5c518] transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          <input ref={ref} type="file" className="hidden" accept=".pdf,.doc,.docx,image/*"
            onChange={(e) => { onUpload(field, e.target.files?.[0]); ref.current.value = ""; }} />
          {uploading ? "Subiendo..." : url ? "Reemplazar" : "Subir"}
        </label>
      </div>
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-widest text-[#1a1f4e]/40 border-b border-[#b8ccd8] pb-1 mb-3">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
