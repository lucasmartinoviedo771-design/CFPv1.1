import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight, ArrowLeft, CheckCircle2, User, BookOpen,
  Monitor, Heart, X, AlertTriangle, UploadCloud, FileText,
} from "lucide-react";
import { apiClientV2 } from "../api/client";

const STORAGE_KEY = "preinscripcion_terciario_v1";

const LOCALIDADES = [
  { value: "ushuaia", label: "Ushuaia" },
  { value: "rg_sur", label: "Río Grande - Margen Sur" },
  { value: "rg_norte", label: "Río Grande - Margen Norte" },
  { value: "tolhuin", label: "Tolhuin" },
  { value: "zona_rural", label: "Zona Rural (Ej: Estancia Cullen)" },
  { value: "otras", label: "Otras Ciudades (fuera de TDF)" },
];

const STEPS = [
  { n: 1, label: "Personales", icon: <User size={18} /> },
  { n: 2, label: "Académicos", icon: <BookOpen size={18} /> },
  { n: 3, label: "Tecnológicos", icon: <Monitor size={18} /> },
  { n: 4, label: "Complementarios", icon: <Heart size={18} /> },
  { n: 5, label: "Documentación", icon: <FileText size={18} /> },
];

const P = { navy: "#1a1f4e", yellow: "#f5c518", blue: "#b8ccd8" };

const inputCls =
  "w-full rounded-xl px-4 py-3 border border-[#b8ccd8] bg-white text-[#1a1f4e] focus:outline-none focus:ring-2 focus:ring-[#f5c518] transition-all text-sm";
const labelCls = "block text-xs font-bold uppercase tracking-wider text-[#1a1f4e] mb-1";

function Field({ label, required, children }) {
  return (
    <div className="space-y-1">
      <label className={labelCls}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Radio({ name, value, current, onSelect, label }) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(name, value)}
      className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
        active
          ? "border-[#f5c518] bg-[#f5c518]/15 text-[#1a1f4e]"
          : "border-[#b8ccd8] bg-white text-[#1a1f4e] hover:border-[#f5c518]/60"
      }`}
    >
      {label}
    </button>
  );
}

function RadioGroup({ name, value, onSelect, options }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Radio key={o.value} name={name} value={o.value} current={value} onSelect={onSelect} label={o.label} />
      ))}
    </div>
  );
}

function FileUpload({ label, required, file, onFile, accept }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);

  return (
    <div>
      <label className={labelCls}>{label} {required && <span className="text-red-500">*</span>}</label>
      <label
        className={`flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
          drag ? "border-[#f5c518] bg-[#f5c518]/5" : file ? "border-green-400 bg-green-50" : "border-[#b8ccd8] bg-white hover:border-[#f5c518]/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer?.files?.[0]; if (f) onFile(f); }}
      >
        <input ref={ref} type="file" className="hidden" accept={accept || ".pdf,.doc,.docx,image/*"} onChange={(e) => onFile(e.target.files?.[0] || null)} />
        {file ? (
          <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
            <CheckCircle2 size={18} /> {file.name}
            <button type="button" onClick={(e) => { e.preventDefault(); onFile(null); ref.current.value = ""; }} className="ml-2 text-red-400 hover:text-red-600">
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud size={28} className="text-[#b8ccd8]" />
            <span className="text-sm text-[#1a1f4e]/60">Arrastrá o hacé clic para adjuntar</span>
            <span className="text-xs text-[#1a1f4e]/40">PDF, Word, JPG, PNG</span>
          </>
        )}
      </label>
    </div>
  );
}

function ProgressBar({ step }) {
  const progress = ((step - 1) / (STEPS.length - 1)) * 100;
  return (
    <div className="w-full mb-10">
      <div className="flex justify-between items-center relative mb-4">
        <div className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 rounded-full bg-[#b8ccd8]" />
        <div className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-[#f5c518] transition-all duration-700" style={{ width: `${progress}%` }} />
        {STEPS.map((s) => (
          <div key={s.n} className="relative z-10 flex flex-col items-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 font-bold text-sm ${
              s.n < step ? "bg-[#f5c518] text-[#1a1f4e] shadow-md" :
              s.n === step ? "bg-[#1a1f4e] text-[#f5c518] scale-110 shadow-lg" :
              "bg-white border-2 border-[#b8ccd8] text-[#c8c4bc]"
            }`}>
              {s.n < step ? <CheckCircle2 size={18} /> : s.icon}
            </div>
            <span className={`absolute -bottom-5 text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${s.n <= step ? "text-[#1a1f4e]" : "text-[#c8c4bc]"}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const INIT_FORM = {
  email: "", apellido_nombre: "", dni: "", cuil: "", sexo: "",
  celular: "", fecha_nacimiento: "", localidad_nacimiento: "",
  provincia_nacimiento: "", nacionalidad: "Argentina", domicilio: "",
  localidad: "", finalizo_secundaria: "", posee_estudios_superiores: "",
  estudios_superiores_finalizado: "", estudios_superiores_carrera: "",
  posee_pc: "", posee_internet: "", pueblo_originario: "",
  posee_discapacidad: "", tipo_discapacidad: "", posee_cud: "",
  apoyo_inclusion: "", requiere_apoyo_especifico: "", descripcion_apoyo: "",
};

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { form: INIT_FORM, step: 1 };
    const parsed = JSON.parse(raw);
    return { form: { ...INIT_FORM, ...parsed.form }, step: parsed.step || 1 };
  } catch { return { form: INIT_FORM, step: 1 }; }
}

export default function PreinscripcionTerciario() {
  const saved = loadSaved();
  const [step, setStep] = useState(saved.step);
  const [form, setForm] = useState(saved.form);
  const [dniFile, setDniFile] = useState(null);
  const [tituloFile, setTituloFile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [rechazado, setRechazado] = useState(false);

  // Persistir en localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ form, step }));
  }, [form, step]);

  const onSelect = (name, value) => setForm((p) => ({ ...p, [name]: value }));
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const validate = (s) => {
    setError("");
    if (s === 1) {
      if (!form.email.trim()) return setError("El email es obligatorio."), false;
      if (!form.apellido_nombre.trim()) return setError("Apellido y nombre son obligatorios."), false;
      if (!form.dni.trim()) return setError("El DNI es obligatorio."), false;
      if (!form.sexo) return setError("El sexo es obligatorio."), false;
      if (!form.celular.trim()) return setError("El celular es obligatorio."), false;
      if (!form.fecha_nacimiento) return setError("La fecha de nacimiento es obligatoria."), false;
      if (!form.localidad_nacimiento.trim()) return setError("La localidad de nacimiento es obligatoria."), false;
      if (!form.provincia_nacimiento.trim()) return setError("La provincia de nacimiento es obligatoria."), false;
      if (!form.domicilio.trim()) return setError("El domicilio es obligatorio."), false;
      if (!form.localidad) return setError("La localidad de residencia es obligatoria."), false;
      if (form.localidad === "otras") { setRechazado(true); return false; }
    }
    if (s === 2) {
      if (!form.finalizo_secundaria) return setError("Indicá si finalizaste el secundario."), false;
      if (!form.posee_estudios_superiores) return setError("Indicá si poseés estudios superiores."), false;
    }
    if (s === 3) {
      if (!form.posee_pc) return setError("Indicá si poseés PC o notebook."), false;
      if (!form.posee_internet) return setError("Indicá si poseés conectividad."), false;
    }
    if (s === 4) {
      if (!form.pueblo_originario) return setError("Indicá si pertenecés a pueblos originarios."), false;
      if (!form.posee_discapacidad) return setError("Indicá si poseés alguna discapacidad."), false;
      if (form.posee_discapacidad === "si") {
        if (!form.tipo_discapacidad) return setError("Indicá el tipo de discapacidad."), false;
        if (!form.posee_cud) return setError("Indicá si poseés CUD."), false;
        if (!form.apoyo_inclusion) return setError("Indicá el tipo de apoyo que recibís en el aula."), false;
        if (!form.requiere_apoyo_especifico) return setError("Indicá si requerís apoyo específico."), false;
        if (form.requiere_apoyo_especifico === "si" && !form.descripcion_apoyo.trim())
          return setError("Describí el tipo de apoyo que necesitás."), false;
      }
    }
    if (s === 5) {
      if (!dniFile) return setError("El DNI digitalizado es obligatorio."), false;
    }
    return true;
  };

  const nextStep = () => {
    if (validate(step)) {
      setStep((p) => Math.min(p + 1, 5));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const prevStep = () => { setError(""); setStep((p) => Math.max(p - 1, 1)); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate(5)) return;
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
      if (dniFile) fd.append("dni_digitalizado", dniFile);
      if (tituloFile) fd.append("titulo_digitalizado", tituloFile);

      await apiClientV2.post("/preinscripcion-terciario", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      localStorage.removeItem(STORAGE_KEY);
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const data = err?.response?.data;
      let msg = "Error al enviar el formulario.";
      if (data) {
        if (typeof data === "string") msg = data;
        else if (data.detail) msg = data.detail;
      }
      setError(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  if (rechazado) {
    return (
      <div className="min-h-screen bg-[#b8ccd8] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-10 text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-[#1a1f4e]">Residencia requerida</h2>
          <p className="text-[#1a1f4e]/70 text-sm leading-relaxed">
            La Tecnicatura en Ciencias de Datos e IA es <strong>exclusiva para residentes de Tierra del Fuego</strong>.
            Solo pueden preinscribirse personas que residan en la provincia.
          </p>
          <button
            onClick={() => { setRechazado(false); setForm((p) => ({ ...p, localidad: "" })); }}
            className="w-full py-3 rounded-xl font-bold text-sm"
            style={{ background: P.navy, color: P.yellow }}
          >
            Volver al formulario
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#b8ccd8] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-10 text-center space-y-6">
          <div className="relative mx-auto w-20 h-20 bg-[#f5c518] rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle2 size={44} className="text-[#1a1f4e]" />
            <div className="absolute inset-0 rounded-full bg-[#f5c518] animate-ping opacity-20" />
          </div>
          <h2 className="text-2xl font-black text-[#1a1f4e]">¡Preinscripción recibida!</h2>
          <p className="text-[#1a1f4e]/70 text-sm leading-relaxed">
            Tu preinscripción fue registrada correctamente. En los próximos días recibirás un email con información en <strong>{form.email}</strong>.
          </p>
          <p className="text-xs text-[#1a1f4e]/50">
            Ante dudas: <a href="mailto:tecnicaturedatos@tdf.edu.ar" className="underline">tecnicaturedatos@tdf.edu.ar</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#b8ccd8] flex flex-col">
      <header style={{ background: P.navy }} className="py-5 px-6 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg flex-shrink-0" style={{ background: P.yellow, color: P.navy }}>P</div>
          <div>
            <p className="text-white font-black text-base leading-tight">Centro Politécnico Superior Malvinas Argentinas</p>
            <p style={{ color: P.yellow }} className="text-xs font-semibold">Tecnicatura en Ciencias de Datos e Inteligencia Artificial</p>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-start justify-center py-10 px-4">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-[#1a1f4e] mb-1">Preinscripción 2026</h1>
            <p className="text-[#1a1f4e]/60 text-sm">Completá los pasos para registrar tu preinscripción.</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10">
            <ProgressBar step={step} />

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 text-red-600 text-sm font-medium">
                <X size={16} className="flex-shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-8 mt-8">

              {/* PASO 1: Datos Personales */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-6 duration-400 space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-[#1a1f4e]">Datos Personales</h2>
                    <p className="text-sm text-[#1a1f4e]/50 mt-0.5">Ingresá tus datos tal como figuran en tu DNI.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <Field label="Email" required>
                        <input type="email" name="email" value={form.email} onChange={onChange} className={inputCls} placeholder="usuario@ejemplo.com" />
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Field label="Apellido y Nombre (tal cual DNI)" required>
                        <input name="apellido_nombre" value={form.apellido_nombre} onChange={onChange} className={inputCls} placeholder="PÉREZ JUAN CARLOS" />
                      </Field>
                    </div>
                    <Field label="DNI" required>
                      <input name="dni" value={form.dni} onChange={onChange} className={inputCls} placeholder="Sin puntos ni espacios" />
                    </Field>
                    <Field label="CUIL">
                      <input name="cuil" value={form.cuil} onChange={onChange} className={inputCls} placeholder="20XXXXXXXXX" />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Sexo" required>
                        <RadioGroup name="sexo" value={form.sexo} onSelect={onSelect} options={[
                          { value: "F", label: "Femenino" },
                          { value: "M", label: "Masculino" },
                          { value: "O", label: "Otro / X" },
                        ]} />
                      </Field>
                    </div>
                    <Field label="Celular" required>
                      <input name="celular" value={form.celular} onChange={onChange} className={inputCls} placeholder="2964 XXXXXX" />
                    </Field>
                    <Field label="Fecha de Nacimiento" required>
                      <input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={onChange} className={inputCls} />
                    </Field>
                    <Field label="Localidad de Nacimiento" required>
                      <input name="localidad_nacimiento" value={form.localidad_nacimiento} onChange={onChange} className={inputCls} placeholder="Ej: Ushuaia" />
                    </Field>
                    <Field label="Provincia de Nacimiento" required>
                      <input name="provincia_nacimiento" value={form.provincia_nacimiento} onChange={onChange} className={inputCls} placeholder="Ej: Tierra del Fuego" />
                    </Field>
                    <Field label="Nacionalidad">
                      <input name="nacionalidad" value={form.nacionalidad} onChange={onChange} className={inputCls} />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Domicilio actual (Calle y número)" required>
                        <input name="domicilio" value={form.domicilio} onChange={onChange} className={inputCls} placeholder="Av. Malvinas 1234" />
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Field label="Localidad de Residencia" required>
                        <select name="localidad" value={form.localidad} onChange={onChange} className={inputCls}>
                          <option value="">Seleccioná tu localidad...</option>
                          {LOCALIDADES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                        {form.localidad === "otras" && (
                          <p className="mt-2 text-xs text-red-500 font-semibold flex items-center gap-1">
                            <AlertTriangle size={12} /> La Tecnicatura es solo para residentes de Tierra del Fuego.
                          </p>
                        )}
                      </Field>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 2: Datos Académicos */}
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-6 duration-400 space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-[#1a1f4e]">Datos Académicos</h2>
                    <p className="text-sm text-[#1a1f4e]/50 mt-0.5">Contanos sobre tu trayectoria educativa.</p>
                  </div>
                  <Field label="¿Finalizaste el secundario?" required>
                    <RadioGroup name="finalizo_secundaria" value={form.finalizo_secundaria} onSelect={onSelect} options={[
                      { value: "si", label: "Sí" },
                      { value: "no", label: "No" },
                      { value: "cursando", label: "Cursando último año" },
                    ]} />
                  </Field>
                  <Field label="¿Poseés estudios superiores (terciarios o universitarios)?" required>
                    <RadioGroup name="posee_estudios_superiores" value={form.posee_estudios_superiores} onSelect={onSelect} options={[
                      { value: "si", label: "Sí" },
                      { value: "no", label: "No" },
                    ]} />
                  </Field>
                  {form.posee_estudios_superiores === "si" && (
                    <div className="space-y-5 p-5 rounded-2xl bg-[#b8ccd8]/30 border border-[#b8ccd8] animate-in fade-in duration-300">
                      <Field label="¿Los finalizaste?">
                        <RadioGroup name="estudios_superiores_finalizado" value={form.estudios_superiores_finalizado} onSelect={onSelect} options={[
                          { value: "si", label: "Sí" }, { value: "no", label: "No" },
                        ]} />
                      </Field>
                      <Field label="Nombre de la carrera">
                        <input name="estudios_superiores_carrera" value={form.estudios_superiores_carrera} onChange={onChange} className={inputCls} placeholder="Ej: Licenciatura en Sistemas" />
                      </Field>
                    </div>
                  )}
                </div>
              )}

              {/* PASO 3: Datos Tecnológicos */}
              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-6 duration-400 space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-[#1a1f4e]">Datos Tecnológicos</h2>
                    <p className="text-sm text-[#1a1f4e]/50 mt-0.5">Información sobre tu acceso a tecnología.</p>
                  </div>
                  <Field label="¿Poseés PC o notebook?" required>
                    <RadioGroup name="posee_pc" value={form.posee_pc} onSelect={onSelect} options={[
                      { value: "si", label: "Sí" }, { value: "no", label: "No" },
                    ]} />
                  </Field>
                  <Field label="¿Poseés conectividad a internet en tu domicilio?" required>
                    <RadioGroup name="posee_internet" value={form.posee_internet} onSelect={onSelect} options={[
                      { value: "si", label: "Sí" }, { value: "no", label: "No" },
                    ]} />
                  </Field>
                </div>
              )}

              {/* PASO 4: Datos Complementarios */}
              {step === 4 && (
                <div className="animate-in fade-in slide-in-from-right-6 duration-400 space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-[#1a1f4e]">Datos Complementarios</h2>
                    <p className="text-sm text-[#1a1f4e]/50 mt-0.5">Información adicional para garantizar la inclusión.</p>
                  </div>
                  <Field label="¿Pertenecés a pueblos originarios?" required>
                    <RadioGroup name="pueblo_originario" value={form.pueblo_originario} onSelect={onSelect} options={[
                      { value: "si", label: "Sí" }, { value: "no", label: "No" },
                    ]} />
                  </Field>
                  <Field label="¿Poseés alguna discapacidad?" required>
                    <RadioGroup name="posee_discapacidad" value={form.posee_discapacidad} onSelect={onSelect} options={[
                      { value: "si", label: "Sí" }, { value: "no", label: "No" },
                    ]} />
                  </Field>
                  {form.posee_discapacidad === "si" && (
                    <div className="space-y-5 p-5 rounded-2xl bg-[#b8ccd8]/30 border border-[#b8ccd8] animate-in fade-in duration-300">
                      {/* 1. Tipo de discapacidad */}
                      <Field label="Tipo de discapacidad" required>
                        <select name="tipo_discapacidad" value={form.tipo_discapacidad} onChange={onChange} className={inputCls}>
                          <option value="">Seleccioná...</option>
                          {[["visual","Visual"],["auditiva","Auditiva"],["intelectual","Intelectual"],["motora","Motora"],["tea","Trastornos de Espectro Autista"],["otra","Otra discapacidad"],["multiple","Más de una discapacidad"]].map(([v,l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                      </Field>

                      {/* 2. CUD — aparece cuando se eligió tipo */}
                      {form.tipo_discapacidad && (
                        <Field label="¿Poseés Certificado Único de Discapacidad (CUD)?" required>
                          <RadioGroup name="posee_cud" value={form.posee_cud} onSelect={onSelect} options={[
                            { value: "si", label: "Sí" }, { value: "no", label: "No" },
                          ]} />
                        </Field>
                      )}

                      {/* 3. Apoyo y requiere apoyo — aparecen cuando CUD fue respondido */}
                      {form.tipo_discapacidad && form.posee_cud && (
                        <>
                          <Field label="Para su inclusión dentro del aula, recibe ayuda de..." required>
                            <RadioGroup name="apoyo_inclusion" value={form.apoyo_inclusion} onSelect={onSelect} options={[
                              { value: "estatal", label: "Sector Estatal" },
                              { value: "privado", label: "Sector Privado" },
                              { value: "ninguno", label: "Ninguno" },
                            ]} />
                          </Field>
                          <Field label="¿Requiere algún tipo de apoyo específico?" required>
                            <RadioGroup name="requiere_apoyo_especifico" value={form.requiere_apoyo_especifico} onSelect={onSelect} options={[
                              { value: "si", label: "Sí" }, { value: "no", label: "No" },
                            ]} />
                          </Field>
                        </>
                      )}

                      {/* 4. Descripción — aparece solo si requiere apoyo específico */}
                      {form.requiere_apoyo_especifico === "si" && (
                        <Field label="Describa el tipo de apoyo que necesita" required>
                          <textarea name="descripcion_apoyo" value={form.descripcion_apoyo} onChange={onChange} className={`${inputCls} resize-none`} rows={3} placeholder="Describí qué tipo de apoyo necesitás" />
                        </Field>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* PASO 5: Documentación */}
              {step === 5 && (
                <div className="animate-in fade-in slide-in-from-right-6 duration-400 space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-[#1a1f4e]">Documentación</h2>
                    <p className="text-sm text-[#1a1f4e]/50 mt-0.5">Adjuntá copias digitales legibles (PDF, Word, JPG o PNG).</p>
                  </div>
                  <FileUpload label="Copia del DNI (frente y dorso)" required file={dniFile} onFile={setDniFile} />
                  <FileUpload
                    label={`Título Secundario${form.finalizo_secundaria === "si" ? " (Obligatorio - finalizaste secundaria)" : " (Opcional)"}`}
                    required={form.finalizo_secundaria === "si"}
                    file={tituloFile}
                    onFile={setTituloFile}
                  />
                  <div className="p-5 rounded-2xl bg-[#1a1f4e]/5 border border-[#1a1f4e]/10">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={22} className="text-[#1a1f4e] flex-shrink-0" />
                      <div>
                        <p className="font-black text-[#1a1f4e] text-sm">Listo para enviar</p>
                        <p className="text-xs text-[#1a1f4e]/60 mt-0.5">Al confirmar declarás que los datos ingresados son verídicos.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer de navegación */}
              <div className="pt-6 border-t border-[#b8ccd8] flex flex-col-reverse sm:flex-row justify-between gap-3">
                {step > 1 && (
                  <button type="button" onClick={prevStep} disabled={saving}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-[#1a1f4e]/20 text-[#1a1f4e] font-bold text-sm hover:bg-[#1a1f4e]/5 transition-all">
                    <ArrowLeft size={15} /> Volver
                  </button>
                )}
                <div className="flex-grow" />
                {step < 5 ? (
                  <button type="button" onClick={nextStep}
                    className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95"
                    style={{ background: P.navy, color: P.yellow }}>
                    Siguiente <ArrowRight size={15} />
                  </button>
                ) : (
                  <button type="submit" disabled={saving}
                    className="flex items-center justify-center gap-2 px-10 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                    style={{ background: P.yellow, color: P.navy }}>
                    {saving ? "Enviando..." : "Confirmar Preinscripción"}
                    <CheckCircle2 size={15} />
                  </button>
                )}
              </div>
            </form>
          </div>

          <p className="text-center text-xs text-[#1a1f4e]/50 mt-6">
            Contacto: <a href="mailto:tecnicaturedatos@tdf.edu.ar" className="underline">tecnicaturedatos@tdf.edu.ar</a>
          </p>
        </div>
      </main>
    </div>
  );
}
