import React from "react";
import { FormState } from "./types";
import { Field, RadioGroup, inputCls } from "./formElements";

interface StepAcademicosProps {
  form: FormState;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSelect: (name: string, value: string) => void;
}

export function StepAcademicos({ form, onChange, onSelect }: StepAcademicosProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-6 duration-400 space-y-6 text-left">
      <div>
        <h2 className="text-xl font-black text-[#1a1f4e]">Datos Académicos</h2>
        <p className="text-sm text-[#1a1f4e]/50 mt-0.5">Contanos sobre tu trayectoria educativa.</p>
      </div>
      <Field label="¿Finalizaste el secundario?" required>
        <RadioGroup
          name="finalizo_secundaria"
          value={form.finalizo_secundaria}
          onSelect={onSelect}
          options={[
            { value: "si", label: "Sí" },
            { value: "no", label: "No" },
            { value: "cursando", label: "Cursando último año" },
          ]}
        />
      </Field>
      <Field label="¿Poseés estudios superiores (terciarios o universitarios)?" required>
        <RadioGroup
          name="posee_estudios_superiores"
          value={form.posee_estudios_superiores}
          onSelect={onSelect}
          options={[
            { value: "si", label: "Sí" },
            { value: "no", label: "No" },
          ]}
        />
      </Field>
      {form.posee_estudios_superiores === "si" && (
        <div className="space-y-5 p-5 rounded-2xl bg-[#b8ccd8]/30 border border-[#b8ccd8] animate-in fade-in duration-300">
          <Field label="¿Los finalizaste?">
            <RadioGroup
              name="estudios_superiores_finalizado"
              value={form.estudios_superiores_finalizado}
              onSelect={onSelect}
              options={[
                { value: "si", label: "Sí" },
                { value: "no", label: "No" },
              ]}
            />
          </Field>
          <Field label="Nombre de la carrera">
            <input
              name="estudios_superiores_carrera"
              value={form.estudios_superiores_carrera}
              onChange={onChange}
              className={inputCls}
              placeholder="Ej: Licenciatura en Sistemas"
            />
          </Field>
        </div>
      )}
    </div>
  );
}
