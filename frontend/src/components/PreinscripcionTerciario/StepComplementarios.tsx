import React from "react";
import { FormState } from "./types";
import { Field, RadioGroup, inputCls } from "./formElements";

interface StepComplementariosProps {
  form: FormState;
  onSelect: (name: string, value: string) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export function StepComplementarios({ form, onSelect, onChange }: StepComplementariosProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-6 duration-400 space-y-6 text-left">
      <div>
        <h2 className="text-xl font-black text-[#1a1f4e]">Datos Complementarios</h2>
        <p className="text-sm text-[#1a1f4e]/50 mt-0.5">Información adicional para garantizar la inclusión.</p>
      </div>
      <Field label="¿Pertenecés a pueblos originarios?" required>
        <RadioGroup
          name="pueblo_originario"
          value={form.pueblo_originario}
          onSelect={onSelect}
          options={[
            { value: "si", label: "Sí" },
            { value: "no", label: "No" },
          ]}
        />
      </Field>
      <Field label="¿Poseés alguna discapacidad?" required>
        <RadioGroup
          name="posee_discapacidad"
          value={form.posee_discapacidad}
          onSelect={onSelect}
          options={[
            { value: "si", label: "Sí" },
            { value: "no", label: "No" },
          ]}
        />
      </Field>
      {form.posee_discapacidad === "si" && (
        <div className="space-y-5 p-5 rounded-2xl bg-[#b8ccd8]/30 border border-[#b8ccd8] animate-in fade-in duration-300">
          {/* 1. Tipo de discapacidad */}
          <Field label="Tipo de discapacidad" required>
            <select
              name="tipo_discapacidad"
              value={form.tipo_discapacidad}
              onChange={onChange}
              className={inputCls}
            >
              <option value="">Seleccioná...</option>
              {[
                ["visual", "Visual"],
                ["auditiva", "Auditiva"],
                ["intelectual", "Intelectual"],
                ["motora", "Motora"],
                ["tea", "Trastornos de Espectro Autista"],
                ["otra", "Otra discapacidad"],
                ["multiple", "Más de una discapacidad"],
              ].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>

          {/* 2. CUD — aparece cuando se eligió tipo */}
          {form.tipo_discapacidad && (
            <Field label="¿Poseés Certificado Único de Discapacidad (CUD)?" required>
              <RadioGroup
                name="posee_cud"
                value={form.posee_cud}
                onSelect={onSelect}
                options={[
                  { value: "si", label: "Sí" },
                  { value: "no", label: "No" },
                ]}
              />
            </Field>
          )}

          {/* 3. Apoyo y requiere apoyo — aparecen cuando CUD fue respondido */}
          {form.tipo_discapacidad && form.posee_cud && (
            <>
              <Field label="Para su inclusión dentro del aula, recibe ayuda de..." required>
                <RadioGroup
                  name="apoyo_inclusion"
                  value={form.apoyo_inclusion}
                  onSelect={onSelect}
                  options={[
                    { value: "estatal", label: "Sector Estatal" },
                    { value: "privado", label: "Sector Privado" },
                    { value: "ninguno", label: "Ninguno" },
                  ]}
                />
              </Field>
              <Field label="¿Requiere algún tipo de apoyo específico?" required>
                <RadioGroup
                  name="requiere_apoyo_especifico"
                  value={form.requiere_apoyo_especifico}
                  onSelect={onSelect}
                  options={[
                    { value: "si", label: "Sí" },
                    { value: "no", label: "No" },
                  ]}
                />
              </Field>
            </>
          )}

          {/* 4. Descripción — aparece solo si requiere apoyo específico */}
          {form.requiere_apoyo_especifico === "si" && (
            <Field label="Describa el tipo de apoyo que necesita" required>
              <textarea
                name="descripcion_apoyo"
                value={form.descripcion_apoyo}
                onChange={onChange}
                className={`${inputCls} resize-none`}
                rows={3}
                placeholder="Describí qué tipo de apoyo necesitás"
              />
            </Field>
          )}
        </div>
      )}
    </div>
  );
}
