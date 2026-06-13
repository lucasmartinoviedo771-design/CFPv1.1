import React, { useState } from "react";
import { UploadCloud, X } from "lucide-react";

export interface DropFileFieldProps {
  label: string;
  required?: boolean;
  file: File | null;
  onFileChange: (file: File | null) => void;
  isDark?: boolean;
  description?: string;
}

export function DropFileField({
  label,
  required,
  file,
  onFileChange,
  isDark = true,
  description
}: DropFileFieldProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer?.files?.[0] || null;
    if (dropped) onFileChange(dropped);
  };

  return (
    <div className="space-y-3 text-left">
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <label className={`block text-sm font-semibold ${isDark ? "text-indigo-200" : "text-slate-700"}`}>
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {file && (
            <button
              type="button"
              onClick={() => onFileChange(null)}
              className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
            >
              <X size={12} /> Limpiar
            </button>
          )}
        </div>
        {description && (
          <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-indigo-300" : "text-slate-500"}`}>
            {description}
          </p>
        )}
      </div>
      <label
        className={`group relative block rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-all duration-300 overflow-hidden ${
          dragOver
            ? "border-cyan-400 bg-cyan-400/10"
            : isDark
            ? "border-indigo-500/30 bg-white/5 hover:border-cyan-400/50"
            : "border-slate-300 bg-white hover:border-sky-500"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,image/*"
          className="hidden"
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
        />
        <div className="flex flex-col items-center text-center space-y-3">
          <div
            className={`p-4 rounded-full transition-transform group-hover:scale-110 ${
              isDark ? "bg-indigo-500/10 text-cyan-400" : "bg-sky-50 text-sky-600"
            }`}
          >
            <UploadCloud size={32} />
          </div>
          <div>
            <p className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              {file ? "¡Archivo detectado!" : "Arrastrá y soltá el archivo acá"}
            </p>
            <p className={`text-xs mt-1 ${isDark ? "text-indigo-300" : "text-slate-500"}`}>
              PDF, JPG o PNG hasta 3MB
            </p>
          </div>
          {file && (
            <div className="mt-4 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 animate-in fade-in slide-in-from-bottom-2">
              <p className="text-sm font-bold text-emerald-400 line-clamp-1">{file.name}</p>
            </div>
          )}
        </div>
      </label>
    </div>
  );
}
