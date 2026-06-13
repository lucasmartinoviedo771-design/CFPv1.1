import React from "react";
import { FormState } from "./types";
import { Field, RadioGroup } from "./formElements";

interface StepTecnologicosProps {
  form: FormState;
  onSelect: (name: string, value: string) => void;
}

export function StepTecnologicos({ form, onSelect }: StepTecnologicosProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-6 duration-400 space-y-6 text-left">
      <div>
        <h2 className="text-xl font-black text-[#1a1f4e]">Datos Tecnológicos</h2>
        <p className="text-sm text-[#1a1f4e]/50 mt-0.5">Información sobre tu acceso a tecnología.</p>
      </div>
      <Field label="¿Poseés PC o notebook?" required>
        <RadioGroup
          name="posee_pc"
          value={form.posee_pc}
          onSelect={onSelect}
          options={[
            { value: "si", label: "Sí" },
            { value: "no", label: "No" },
          ]}
        />
      </Field>
      <Field label="¿Poseés conectividad a internet en tu domicilio?" required>
        <RadioGroup
          name="posee_internet"
          value={form.posee_internet}
          onSelect={onSelect}
          options={[
            { value: "si", label: "Sí" },
            { value: "no", label: "No" },
          ]}
        />
      </Field>
    </div>
  );
}
