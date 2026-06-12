import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight, ArrowLeft, CheckCircle2, User, BookOpen,
  Monitor, Heart, X, AlertTriangle, UploadCloud,
} from "lucide-react";
import { apiClientV2 } from "../api/client";

const STORAGE_KEY = "preinscripcion_terciario_v1";

const PROVINCIAS_AR = [
  "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Ciudad Autónoma de Buenos Aires",
  "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja",
  "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis",
  "Santa Cruz", "Santa Fe", "Santiago del Estero",
  "Tierra del Fuego, Antártida e Islas del Atlántico Sur", "Tucumán",
];

const CIUDADES_POR_PROVINCIA: Record<string, string[]> = {
  "Buenos Aires": ["La Plata", "Mar del Plata", "Bahía Blanca", "Quilmes", "Lanús", "Lomas de Zamora", "General Roca", "Tandil", "Pergamino", "San Nicolás", "Otra"],
  "Catamarca": ["San Fernando del Valle de Catamarca", "San Isidro", "Belén", "Santa María", "Andalgalá", "Otra"],
  "Chaco": ["Resistencia", "Presidencia Roque Sáenz Peña", "Villa Ángela", "Charata", "Otra"],
  "Chubut": ["Rawson", "Comodoro Rivadavia", "Trelew", "Puerto Madryn", "Esquel", "Otra"],
  "Ciudad Autónoma de Buenos Aires": ["CABA", "Otra"],
  "Córdoba": ["Córdoba", "Villa María", "Río Cuarto", "San Francisco", "Villa Carlos Paz", "Alta Gracia", "Otra"],
  "Corrientes": ["Corrientes", "Goya", "Mercedes", "Paso de los Libres", "Otra"],
  "Entre Ríos": ["Paraná", "Concordia", "Gualeguaychú", "Concepción del Uruguay", "Otra"],
  "Formosa": ["Formosa", "Clorinda", "Pirané", "Otra"],
  "Jujuy": ["San Salvador de Jujuy", "San Pedro de Jujuy", "Palpalá", "Libertador General San Martín", "Otra"],
  "La Pampa": ["Santa Rosa", "General Pico", "Otra"],
  "La Rioja": ["La Rioja", "Chilecito", "Otra"],
  "Mendoza": ["Mendoza", "San Rafael", "Godoy Cruz", "Luján de Cuyo", "Maipú", "Otra"],
  "Misiones": ["Posadas", "Oberá", "Eldorado", "Puerto Iguazú", "Otra"],
  "Neuquén": ["Neuquén", "San Martín de los Andes", "Zapala", "Cutral Có", "Otra"],
  "Río Negro": ["Viedma", "Bariloche", "General Roca", "Cipolletti", "Otra"],
  "Salta": ["Salta", "San Ramón de la Nueva Orán", "Tartagal", "Metán", "Otra"],
  "San Juan": ["San Juan", "Rawson", "Rivadavia", "Otra"],
  "San Luis": ["San Luis", "Villa Mercedes", "Otra"],
  "Santa Cruz": ["Río Gallegos", "Caleta Olivia", "Pico Truncado", "Puerto Deseado", "Otra"],
  "Santa Fe": ["Santa Fe", "Rosario", "Rafaela", "Santo Tomé", "Venado Tuerto", "Otra"],
  "Santiago del Estero": ["Santiago del Estero", "La Banda", "Otra"],
  "Tierra del Fuego, Antártida e Islas del Atlántico Sur": ["Ushuaia", "Río Grande - Margen Sur", "Río Grande - Margen Norte", "Tolhuin", "Zona Rural (Ej: Estancia Cullen)", "Otra"],
  "Tucumán": ["San Miguel de Tucumán", "Concepción", "Banda del Río Salí", "Otra"],
};

const LOCALIDADES = [
  { value: "ushuaia", label: "Ushuaia" },
  { value: "rg_sur", label: "Río Grande - Margen Sur" },
  { value: "rg_norte", label: "Río Grande - Margen Norte" },
  { value: "tolhuin", label: "Tolhuin" },
  { value: "zona_rural", label: "Zona Rural (Ej: Estancia Cullen)" },
];

interface StepItem {
  n: number;
  label: string;
  icon: React.ReactNode;
}

const STEPS: StepItem[] = [
  { n: 1, label: "Personales", icon: <User size={18} /> },
  { n: 2, label: "Académicos", icon: <BookOpen size={18} /> },
  { n: 3, label: "Tecnológicos", icon: <Monitor size={18} /> },
  { n: 4, label: "Complementarios", icon: <Heart size={18} /> },
];

const P = { navy: "#1a1f4e", yellow: "#f5c518", blue: "#b8ccd8" };

const inputCls =
  "w-full rounded-xl px-4 py-3 border border-[#b8ccd8] bg-white text-[#1a1f4e] focus:outline-none focus:ring-2 focus:ring-[#f5c518] transition-all text-sm";
const labelCls = "block text-xs font-bold uppercase tracking-wider text-[#1a1f4e] mb-1";

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, required, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <label className={labelCls}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

interface RadioProps {
  name: string;
  value: string;
  current: string;
  onSelect: (name: string, value: string) => void;
  label: string;
}

function Radio({ name, value, current, onSelect, label }: RadioProps) {
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

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  name: string;
  value: string;
  onSelect: (name: string, value: string) => void;
  options: RadioOption[];
}

function RadioGroup({ name, value, onSelect, options }: RadioGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Radio key={o.value} name={name} value={o.value} current={value} onSelect={onSelect} label={o.label} />
      ))}
    </div>
  );
}

interface FileUploadProps {
  label: string;
  required?: boolean;
  file: File | null;
  onFile: (file: File | null) => void;
  accept?: string;
}

function FileUpload({ label, required, file, onFile, accept }: FileUploadProps) {
  const ref = useRef<HTMLInputElement>(null);
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
            <button type="button" onClick={(e) => { e.preventDefault(); onFile(null); if (ref.current) ref.current.value = ""; }} className="ml-2 text-red-400 hover:text-red-600">
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

interface ProgressBarProps {
  step: number;
}

function ProgressBar({ step }: ProgressBarProps) {
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

interface FormState {
  email: string;
  apellido: string;
  nombre: string;
  dni: string;
  cuil: string;
  sexo: string;
  celular: string;
  fecha_nacimiento: string;
  localidad_nacimiento: string;
  localidad_nacimiento_otra: string;
  provincia_nacimiento: string;
  nacionalidad: string;
  domicilio: string;
  provincia_residencia: string;
  localidad: string;
  finalizo_secundaria: string;
  posee_estudios_superiores: string;
  estudios_superiores_finalizado: string;
  estudios_superiores_carrera: string;
  posee_pc: string;
  posee_internet: string;
  pueblo_originario: string;
  posee_discapacidad: string;
  tipo_discapacidad: string;
  posee_cud: string;
  apoyo_inclusion: string;
  requiere_apoyo_especifico: string;
  descripcion_apoyo: string;
}

const INIT_FORM: FormState = {
  email: "", apellido: "", nombre: "", dni: "", cuil: "", sexo: "",
  celular: "", fecha_nacimiento: "", localidad_nacimiento: "", localidad_nacimiento_otra: "",
  provincia_nacimiento: "", nacionalidad: "Argentina", domicilio: "",
  provincia_residencia: "", localidad: "", finalizo_secundaria: "", posee_estudios_superiores: "",
  estudios_superiores_finalizado: "", estudios_superiores_carrera: "",
  posee_pc: "", posee_internet: "", pueblo_originario: "",
  posee_discapacidad: "", tipo_discapacidad: "", posee_cud: "",
  apoyo_inclusion: "", requiere_apoyo_especifico: "", descripcion_apoyo: "",
};

const getEmailPorLocalidad = (localidad: string) => {
  if (localidad === "ushuaia") {
    return "Tutoria.cetns.ush@tdf.edu.ar";
  }
  if (localidad === "tolhuin") {
    return "Tutoria.cetns.tol@tdf.edu.ar";
  }
  return "Tutoria.cetns.rg@gmail.com";
};

interface ProvinciaSelectProps {
  value: string;
  onChange: (prov: string) => void;
  className?: string;
}

function ProvinciaSelect({ value, onChange, className }: ProvinciaSelectProps) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.length === 0
    ? PROVINCIAS_AR
    : PROVINCIAS_AR.filter(p => p.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (prov: string) => {
    setQuery(prov);
    setOpen(false);
    onChange(prov);
  };

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        placeholder="Escribí o seleccioná tu provincia..."
        className={className}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); onChange(""); }}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 rounded-xl border border-white/20 shadow-xl max-h-52 overflow-y-auto"
          style={{ background: "#1a1f4e" }}>
          {filtered.map(p => (
            <li key={p}
              onMouseDown={() => select(p)}
              className="px-4 py-2 cursor-pointer text-sm text-white hover:bg-white/10">
              {p}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function loadSaved(): { form: FormState; step: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { form: INIT_FORM, step: 1 };
    const parsed = JSON.parse(raw) as { form?: Partial<FormState>; step?: number; expiresAt?: number } | null;
    if (!parsed) return { form: INIT_FORM, step: 1 };
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return { form: INIT_FORM, step: 1 };
    }
    return { form: { ...INIT_FORM, ...parsed.form }, step: parsed.step || 1 };
  } catch { return { form: INIT_FORM, step: 1 }; }
}

interface PreinscripcionConfig {
  abierta: boolean;
  mensaje_cierre?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export default function PreinscripcionTerciario() {
  const saved = loadSaved();
  const [step, setStep] = useState(saved.step);
  const [form, setForm] = useState<FormState>(saved.form);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [rechazado, setRechazado] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [config, setConfig] = useState<PreinscripcionConfig | null>(null);

  useEffect(() => {
    apiClientV2.get<PreinscripcionConfig>("/preinscripcion-terciario-config")
      .then(({ data }) => setConfig(data))
      .catch(() => setConfig({ abierta: false, mensaje_cierre: "No se pudo verificar el estado del formulario." }))
      .finally(() => setConfigLoading(false));
  }, []);

  // Persistir en localStorage con expiración de 24 horas
  useEffect(() => {
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ form, step, expiresAt }));
  }, [form, step]);

  const onSelect = (name: string, value: string) => setForm((p) => {
    const next = { ...p, [name]: value };
    if (name === "posee_discapacidad" && value === "no") {
      next.tipo_discapacidad = "";
      next.posee_cud = "";
      next.apoyo_inclusion = "";
      next.requiere_apoyo_especifico = "";
      next.descripcion_apoyo = "";
    }
    if (name === "posee_estudios_superiores" && value === "no") {
      next.estudios_superiores_finalizado = "";
      next.estudios_superiores_carrera = "";
    }
    return next;
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const validate = (s: number): boolean => {
    setError("");
    if (s === 1) {
      if (!form.email.trim()) return setError("El email es obligatorio."), false;
      if (!form.apellido.trim()) return setError("El apellido es obligatorio."), false;
      if (!form.nombre.trim()) return setError("El nombre es obligatorio."), false;
      if (!form.dni.trim()) return setError("El DNI es obligatorio."), false;
      if (!form.sexo) return setError("El sexo es obligatorio."), false;
      if (!form.celular.trim()) return setError("El celular es obligatorio."), false;
      if (!form.fecha_nacimiento) return setError("La fecha de nacimiento es obligatoria."), false;
      if (!form.provincia_nacimiento) return setError("La provincia de nacimiento es obligatoria."), false;
      if (!form.localidad_nacimiento) return setError("La localidad de nacimiento es obligatoria."), false;
      if (form.localidad_nacimiento === "Otra" && !form.localidad_nacimiento_otra.trim()) return setError("Especificá tu localidad de nacimiento."), false;
      if (!form.domicilio.trim()) return setError("El domicilio es obligatorio."), false;
      if (!form.provincia_residencia) return setError("La provincia de residencia es obligatoria."), false;
      if (!form.localidad) return setError("La localidad de residencia es obligatoria."), false;
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
    return true;
  };

  const nextStep = () => {
    if (validate(step)) {
      setStep((p) => Math.min(p + 1, 5));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const prevStep = () => { setError(""); setStep((p) => Math.max(p - 1, 1)); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step < 4) {
      nextStep();
      return;
    }
    
    // Validar todos los pasos secuencialmente antes de enviar
    for (let i = 1; i <= 4; i++) {
      if (!validate(i)) {
        setStep(i);
        return;
      }
    }
    
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));

      await apiClientV2.post("/preinscripcion-terciario", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      localStorage.removeItem(STORAGE_KEY);
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const errorObj = err as { response?: { data?: string | { detail?: string } } };
      const data = errorObj.response?.data;
      let msg = "Error al enviar el formulario.";
      if (data) {
        if (typeof data === "string") msg = data;
        else if (data && typeof data === "object" && "detail" in data && typeof data.detail === "string") {
          msg = data.detail;
        }
      }
      setError(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  if (rechazado) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#1a1f4e" }}>
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="mx-auto w-28 h-28 bg-red-500/20 rounded-full flex items-center justify-center border-4 border-red-500/40">
            <AlertTriangle size={60} className="text-red-400" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white leading-tight">
              Solo residentes de<br />Tierra del Fuego
            </h2>
            <p className="text-white/60 text-lg leading-relaxed">
              La <span className="text-[#f5c518] font-semibold">Tecnicatura en Ciencias de Datos e IA</span> es exclusiva para personas que residan en la provincia de Tierra del Fuego, Antártida e Islas del Atlántico Sur.
            </p>
            <p className="text-white/40 text-sm">
              Si creés que esto es un error o tu situación es especial, comunicate con la institución.
            </p>
          </div>
          <button
            onClick={() => { setRechazado(false); setForm((p) => ({ ...p, provincia_residencia: "", localidad: "" })); }}
            className="px-8 py-4 rounded-2xl font-bold text-base transition-opacity hover:opacity-90"
            style={{ background: "#f5c518", color: "#1a1f4e" }}
          >
            ← Volver al formulario
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
            Ante dudas: <a href={`mailto:${getEmailPorLocalidad(form.localidad)}`} className="underline">{getEmailPorLocalidad(form.localidad)}</a>
          </p>
        </div>
      </div>
    );
  }

  const Header = () => (
    <header style={{ background: P.navy }} className="shadow-lg">
      <div className="max-w-3xl mx-auto">
        <img 
          src="/banner_preinscripcion.png" 
          alt="Centro Politécnico Superior Malvinas Argentinas" 
          className="w-full h-auto object-contain block"
        />
      </div>
    </header>
  );

  if (configLoading) return (
    <div className="min-h-screen bg-[#b8ccd8] flex flex-col">
      <Header />
      <div className="flex-grow flex items-center justify-center text-[#1a1f4e]/50 text-sm">Cargando...</div>
    </div>
  );

  if (!config?.abierta) return (
    <div className="min-h-screen bg-[#b8ccd8] flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="text-lg md:text-xl font-black uppercase tracking-widest text-[#1a1f4e] leading-tight max-w-md mx-auto">
            Tecnicatura en Ciencias de<br />Datos e Inteligencia Artificial
          </div>
          <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center" style={{ background: P.navy }}>
            <span className="text-4xl">📋</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#1a1f4e] mb-3">Preinscripciones cerradas</h1>
            <p className="text-[#1a1f4e]/70 text-sm leading-relaxed">
              {config?.mensaje_cierre || "Las preinscripciones están cerradas en este momento."}
            </p>
          </div>
          {(config?.fecha_inicio || config?.fecha_fin) && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: P.yellow + "30", color: P.navy }}>
              📅 Período: {config.fecha_inicio || "—"} al {config.fecha_fin || "—"}
            </div>
          )}
        </div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#b8ccd8] flex flex-col">
      <Header />

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
                    <Field label="Apellido (tal cual DNI)" required>
                      <input name="apellido" value={form.apellido} onChange={onChange} className={inputCls} placeholder="PÉREZ LÓPEZ" />
                    </Field>
                    <Field label="Nombre (tal cual DNI)" required>
                      <input name="nombre" value={form.nombre} onChange={onChange} className={inputCls} placeholder="JUAN CARLOS" />
                    </Field>
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
                    <Field label="Provincia de Nacimiento" required>
                      <select name="provincia_nacimiento" value={form.provincia_nacimiento}
                        onChange={(e) => { onChange(e); setForm((p) => ({ ...p, localidad_nacimiento: "", localidad_nacimiento_otra: "" })); }}
                        className={inputCls}>
                        <option value="">Seleccioná una provincia...</option>
                        {PROVINCIAS_AR.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </Field>
                    <Field label="Localidad de Nacimiento" required>
                      {form.provincia_nacimiento ? (
                        <>
                          <select name="localidad_nacimiento" value={form.localidad_nacimiento} onChange={onChange} className={inputCls}>
                            <option value="">Seleccioná una localidad...</option>
                            {(CIUDADES_POR_PROVINCIA[form.provincia_nacimiento] || ["Otra"]).map((c) => (
                              <option key={c} value={c}>{c}</option>
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
                        <input name="domicilio" value={form.domicilio} onChange={onChange} className={inputCls} placeholder="Av. Malvinas 1234" />
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
                          {PROVINCIAS_AR.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </Field>
                    </div>
                    {form.provincia_residencia === "Tierra del Fuego, Antártida e Islas del Atlántico Sur" && (
                      <div className="md:col-span-2">
                        <Field label="Localidad de Residencia" required>
                          <select name="localidad" value={form.localidad} onChange={onChange} className={inputCls}>
                            <option value="">Seleccioná tu localidad...</option>
                            {LOCALIDADES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                          </select>
                        </Field>
                      </div>
                    )}
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

              {/* Confirmación final — paso 4 */}
              {step === 4 && (
                <div className="p-5 rounded-2xl bg-[#1a1f4e]/5 border border-[#1a1f4e]/10 mt-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={22} className="text-[#1a1f4e] flex-shrink-0" />
                    <div>
                      <p className="font-black text-[#1a1f4e] text-sm">Listo para enviar</p>
                      <p className="text-xs text-[#1a1f4e]/60 mt-0.5">Al confirmar declarás que los datos ingresados son verídicos.</p>
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
                {step < 4 ? (
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
            Contacto: <a href={`mailto:${getEmailPorLocalidad(form.localidad)}`} className="underline">{getEmailPorLocalidad(form.localidad)}</a>
          </p>
        </div>
      </main>
    </div>
  );
}
