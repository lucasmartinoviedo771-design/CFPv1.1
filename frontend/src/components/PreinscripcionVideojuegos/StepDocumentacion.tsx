import React from "react";
import { CheckCircle2 } from "lucide-react";
import { DropFileField } from "../Preinscripcion/DropFileField";

interface StepDocumentacionProps {
  esMenor: boolean;
  dniFile: File | null;
  onDniFileChange: (file: File | null) => void;
  dniTutorFile: File | null;
  onDniTutorFileChange: (file: File | null) => void;
  tituloFile: File | null;
  onTituloFileChange: (file: File | null) => void;
}

export function StepDocumentacion({
  esMenor,
  dniFile,
  onDniFileChange,
  dniTutorFile,
  onDniTutorFileChange,
  tituloFile,
  onTituloFileChange,
}: StepDocumentacionProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8 text-left">
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-white">Documentación Digital</h2>
        <p className="text-indigo-300">Subí copias digitales legibles de la documentación requerida.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <DropFileField
          label="Copia Frente y Dorso de tu DNI"
          required
          file={dniFile}
          onFileChange={onDniFileChange}
          isDark={true}
        />
        {esMenor ? (
          <DropFileField
            label="Copia DNI del Padre/Madre o Tutor (Obligatorio)"
            required
            file={dniTutorFile}
            onFileChange={onDniTutorFileChange}
            isDark={true}
          />
        ) : (
          <DropFileField
            label="Copia de Título Secundario / Analítico"
            required
            file={tituloFile}
            onFileChange={onTituloFileChange}
            isDark={true}
            description="Formatos permitidos: PDF o foto/imagen. Deben incluirse todas sus hojas, tanto el anverso como el reverso."
          />
        )}
      </div>
      <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/20">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500 text-[#050814] shadow-lg shadow-emerald-500/20">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="font-black tracking-tight leading-none text-white">Postulación Lista para Enviar</p>
            <p className="text-sm text-indigo-300 mt-1">Al enviar, declarás que la información proporcionada es verídica.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
