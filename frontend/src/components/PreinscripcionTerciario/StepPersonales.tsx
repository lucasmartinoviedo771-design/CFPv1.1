import React from "react";
import { FormState } from "./types";
import { Field, RadioGroup, inputCls } from "./formElements";
import { PROVINCIAS_AR, CIUDADES_POR_PROVINCIA, LOCALIDADES } from "./constants";

interface StepPersonalesProps {
  form: FormState;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSelect: (name: string, value: string) => void;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  setRechazado: (val: boolean) => void;
}

export function StepPersonales({
  form,
  onChange,
  onSelect,
  setForm,
  setRechazado,
}: StepPersonalesProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-6 duration-400 space-y-5 text-left">
      <div>
        <h2 className="text-xl font-black text-[#1a1f4e]">Datos Personales</h2>
        <p className="text-sm text-[#1a1f4e]/50 mt-0.5">Ingresá tus datos tal como figuran en tu DNI.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <Field label="Email" required>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              className={inputCls}
              placeholder="usuario@ejemplo.com"
            />
          </Field>
        </div>
        <Field label="Apellido (tal cual DNI)" required>
          <input
            name="apellido"
            value={form.apellido}
            onChange={onChange}
            className={inputCls}
            placeholder="PÉREZ LÓPEZ"
          />
        </Field>
        <Field label="Nombre (tal cual DNI)" required>
          <input
            name="nombre"
            value={form.nombre}
            onChange={onChange}
            className={inputCls}
            placeholder="JUAN CARLOS"
          />
        </Field>
        <Field label="DNI" required>
          <input
            name="dni"
            value={form.dni}
            onChange={onChange}
            className={inputCls}
            placeholder="Sin puntos ni espacios"
          />
        </Field>
        <Field label="CUIL">
          <input
            name="cuil"
            value={form.cuil}
            onChange={onChange}
            className={inputCls}
            placeholder="20XXXXXXXXX"
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Sexo" required>
            <RadioGroup
              name="sexo"
              value={form.sexo}
              onSelect={onSelect}
              options={[
                { value: "F", label: "Femenino" },
                { value: "M", label: "Masculino" },
                { value: "O", label: "Otro / X" },
              ]}
            />
          </Field>
        </div>
        <Field label="Celular (sin espacios ni guiones)" required>
          <input
            name="celular"
            value={form.celular}
            onChange={(e) => {
              const only = e.target.value.replace(/\D/g, "").slice(0, 10);
              onChange({ ...e, target: { ...e.target, name: "celular", value: only } } as React.ChangeEvent<HTMLInputElement>);
            }}
            className={inputCls}
            placeholder="Ej: 2964123456"
            maxLength={10}
            inputMode="numeric"
          />
        </Field>
        <Field label="Fecha de Nacimiento" required>
          <input
            type="date"
            name="fecha_nacimiento"
            value={form.fecha_nacimiento}
            onChange={onChange}
            className={inputCls}
          />
        </Field>
        <Field label="Provincia de Nacimiento" required>
          <select
            name="provincia_nacimiento"
            value={form.provincia_nacimiento}
            onChange={(e) => {
              onChange(e);
              setForm((p) => ({ ...p, localidad_nacimiento: "", localidad_nacimiento_otra: "" }));
            }}
            className={inputCls}
          >
            <option value="">Seleccioná una provincia...</option>
            {PROVINCIAS_AR.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Localidad de Nacimiento" required>
          {form.provincia_nacimiento ? (
            <>
              <select
                name="localidad_nacimiento"
                value={form.localidad_nacimiento}
                onChange={onChange}
                className={inputCls}
              >
                <option value="">Seleccioná una localidad...</option>
                {(CIUDADES_POR_PROVINCIA[form.provincia_nacimiento] || ["Otra"]).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {form.localidad_nacimiento === "Otra" && (
                <input
                  name="localidad_nacimiento_otra"
                  value={form.localidad_nacimiento_otra}
                  onChange={onChange}
                  className={`${inputCls} mt-2`}
                  placeholder="Escribí tu localidad..."
                />
              )}
            </>
          ) : (
            <input disabled className={inputCls} placeholder="Primero seleccioná una provincia" />
          )}
        </Field>
        <Field label="Nacionalidad">
          <input name="nacionalidad" value={form.nacionalidad} onChange={onChange} className={inputCls} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Domicilio actual (Calle y número)" required>
            <input
              name="domicilio"
              value={form.domicilio}
              onChange={onChange}
              className={inputCls}
              placeholder="Av. Malvinas 1234"
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Provincia de Residencia" required>
            <select
              name="provincia_residencia"
              value={form.provincia_residencia}
              className={inputCls}
              onChange={(e) => {
                const prov = e.target.value;
                setForm((p) => ({ ...p, provincia_residencia: prov, localidad: "" }));
                if (prov && prov !== "Tierra del Fuego, Antártida e Islas del Atlántico Sur") {
                  setRechazado(true);
                }
              }}
            >
              <option value="">Seleccioná una provincia...</option>
              {PROVINCIAS_AR.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {form.provincia_residencia === "Tierra del Fuego, Antártida e Islas del Atlántico Sur" && (
          <div className="md:col-span-2">
            <Field label="Localidad de Residencia" required>
              <select name="localidad" value={form.localidad} onChange={onChange} className={inputCls}>
                <option value="">Seleccioná tu localidad...</option>
                {LOCALIDADES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}
