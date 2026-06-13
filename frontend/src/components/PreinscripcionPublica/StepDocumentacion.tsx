import React from "react";
import { CheckCircle2 } from "lucide-react";
import { DropFileField } from "../Preinscripcion/DropFileField";

interface StepDocumentacionProps {
  esMenor: boolean;
  requiresTitle: boolean;
  dniFile: File | null;
  onDniFileChange: (file: File | null) => void;
  dniTutorFile: File | null;
  onDniTutorFileChange: (file: File | null) => void;
  tituloFile: File | null;
  onTituloFileChange: (file: File | null) => void;
  isDark: boolean;
}

export function StepDocumentacion({
  esMenor,
  requiresTitle,
  dniFile,
  onDniFileChange,
  dniTutorFile,
  onDniTutorFileChange,
  tituloFile,
  onTituloFileChange,
  isDark,
}: StepDocumentacionProps) {
  const textTitleCls = isDark ? "text-white" : "text-[#0f172a]";
  const textHelpCls = isDark ? "text-indigo-200" : "text-[#1e3a5f]";

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8 text-left">
      <div className="space-y-2">
        <h2 className={`text-2xl font-black ${textTitleCls}`}>Documentación</h2>
        <p className={textHelpCls}>Subí copias digitales legibles.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <DropFileField
          label="Digitalización de DNI"
          required
          file={dniFile}
          onFileChange={onDniFileChange}
          isDark={isDark}
        />
        {esMenor ? (
          <DropFileField
            label="DNI del Padre/Madre o Tutor (Obligatorio)"
            required
            file={dniTutorFile}
            onFileChange={onDniTutorFileChange}
            isDark={isDark}
          />
        ) : (
          requiresTitle && (
            <DropFileField
              label="Digitalización de Título Secundario"
              required
              file={tituloFile}
              onFileChange={onTituloFileChange}
              isDark={isDark}
              description="Formatos permitidos: PDF o foto/imagen. Recordá incluir todas sus hojas (anverso y reverso)."
            />
          )
        )}
      </div>
      <div
        className={`p-6 rounded-3xl ${
          isDark ? "bg-emerald-500/5 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-200"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="font-black tracking-tight leading-none text-left">Listo para enviar</p>
            <p className="text-sm opacity-70 text-left">Al hacer clic en enviar, confirmás que tus datos son verídicos.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
